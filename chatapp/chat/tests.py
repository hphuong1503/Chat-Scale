"""Baseline behavior: specs/000-sdd-foundation/evidence.md."""
import sys
from unittest.mock import AsyncMock, MagicMock, patch

if "daphne" not in sys.modules:
    sys.modules["daphne"] = MagicMock()
    sys.modules["daphne.testing"] = MagicMock()

from channels.testing import WebsocketCommunicator
from chatapp.asgi import application
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Message, Room, RoomMember
from .serializer import to_canonical_representation
from .tasks import create_message_task


class RoomHistoryBaselineTests(APITestCase):
    def setUp(self):
        users = get_user_model()
        self.member = users.objects.create_user(username="member", password="test-password")
        self.outsider = users.objects.create_user(username="outsider", password="test-password")
        self.room = Room.objects.create(name="Private", created_by=self.member)
        RoomMember.objects.create(room=self.room, user=self.member, role="ADMIN")
        self.message = Message.objects.create(room=self.room, sender=self.member, message="Private message")
        self.history_url = f"/rooms/{self.room.id}/messages/"

    def authenticate(self, user):
        token = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_member_reads_room_history(self):
        self.authenticate(self.member)
        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data["results"]], [str(self.message.id)])

    def test_outsider_cannot_read_room_history(self):
        self.authenticate(self.outsider)
        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, 404)
        self.assertNotIn("Private message", str(response.data))

    def test_anonymous_cannot_read_room_history(self):
        self.assertEqual(self.client.get(self.history_url).status_code, 401)

    def test_room_listing_excludes_other_users_rooms(self):
        self.authenticate(self.outsider)
        response = self.client.get("/rooms/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"], [])

    def test_member_reads_room_history_with_multiple_members(self):
        second_member = get_user_model().objects.create_user(username="second_member", password="test-password")
        RoomMember.objects.create(room=self.room, user=second_member, role="MEMBER")
        second_msg = Message.objects.create(room=self.room, sender=second_member, message="Second message")
        self.authenticate(self.member)
        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, 200)
        result_ids = [item["id"] for item in response.data["results"]]
        self.assertIn(str(self.message.id), result_ids)
        self.assertIn(str(second_msg.id), result_ids)

    def test_worker_persists_and_broadcasts_message(self):
        layer = AsyncMock()
        with patch("chat.tasks.get_channel_layer", return_value=layer):
            create_message_task.run(self.member.id, "Worker message", self.room.id)
        msg = Message.objects.filter(room=self.room, sender=self.member, message="Worker message").first()
        self.assertIsNotNone(msg)
        canonical = to_canonical_representation(msg)
        layer.group_send.assert_awaited_once_with(f"chat_{self.room.id}", {
            "type": "chat_message",
            "data": canonical,
            "message": "Worker message",
            "sender_id": str(self.member.id),
            "room_id": str(self.room.id),
        })



class MessageSendAccessTests(APITestCase):
    def setUp(self):
        users = get_user_model()
        self.member = users.objects.create_user(username="send_member", password="test-password")
        self.outsider = users.objects.create_user(username="send_outsider", password="test-password")
        self.room = Room.objects.create(name="Send Room", created_by=self.member)
        RoomMember.objects.create(room=self.room, user=self.member, role="ADMIN")
        self.url = "/messages/"

    def authenticate(self, user):
        token = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_ac001_anonymous_send_rejected(self):
        with patch("chat.views.create_message_task.delay") as mock_delay:
            resp = self.client.post(self.url, {"room": str(self.room.id), "message": "hello"}, format="json")
        self.assertEqual(resp.status_code, 401)
        mock_delay.assert_not_called()
        self.assertEqual(Message.objects.count(), 0)

    def test_ac002_member_valid_send_with_jwt_enqueues_authenticated_sender(self):
        self.authenticate(self.member)
        with patch("chat.views.create_message_task.delay") as mock_delay:
            resp = self.client.post(self.url, {
                "room": str(self.room.id),
                "message": "valid jwt message",
                "sender": self.outsider.id,
            }, format="json")
        self.assertEqual(resp.status_code, 202)
        self.assertEqual(resp.data, {"status": "Message creation queued"})
        mock_delay.assert_called_once_with(
            sender_id=self.member.id,
            message="valid jwt message",
            room_id=self.room.id,
        )

    def test_ac002_member_valid_send_with_session_enqueues_authenticated_sender(self):
        self.client.force_login(self.member)
        with patch("chat.views.create_message_task.delay") as mock_delay:
            resp = self.client.post(self.url, {
                "room": str(self.room.id),
                "message": "valid session message",
            }, format="json")
        self.assertEqual(resp.status_code, 202)
        mock_delay.assert_called_once_with(
            sender_id=self.member.id,
            message="valid session message",
            room_id=self.room.id,
        )

    def test_ac003_outsider_send_returns_404(self):
        self.authenticate(self.outsider)
        with patch("chat.views.create_message_task.delay") as mock_delay:
            resp = self.client.post(self.url, {"room": str(self.room.id), "message": "unauthorized"}, format="json")
        self.assertEqual(resp.status_code, 404)
        mock_delay.assert_not_called()
        self.assertEqual(Message.objects.count(), 0)

    def test_ac003_nonexistent_room_send_returns_404(self):
        import uuid
        self.authenticate(self.member)
        unknown_room_id = uuid.uuid4()
        with patch("chat.views.create_message_task.delay") as mock_delay:
            resp = self.client.post(self.url, {"room": str(unknown_room_id), "message": "to nowhere"}, format="json")
        self.assertEqual(resp.status_code, 404)
        mock_delay.assert_not_called()
        self.assertEqual(Message.objects.count(), 0)

    def test_ac007_malformed_room_uuid_returns_400(self):
        self.authenticate(self.member)
        with patch("chat.views.create_message_task.delay") as mock_delay:
            resp = self.client.post(self.url, {"room": "not-a-uuid", "message": "hello"}, format="json")
        self.assertEqual(resp.status_code, 400)
        mock_delay.assert_not_called()

    def test_ac007_empty_message_returns_400(self):
        self.authenticate(self.member)
        with patch("chat.views.create_message_task.delay") as mock_delay:
            resp = self.client.post(self.url, {"room": str(self.room.id), "message": ""}, format="json")
        self.assertEqual(resp.status_code, 400)
        mock_delay.assert_not_called()

    def test_ac007_missing_room_returns_400(self):
        self.authenticate(self.member)
        with patch("chat.views.create_message_task.delay") as mock_delay:
            resp = self.client.post(self.url, {"message": "missing room"}, format="json")
        self.assertEqual(resp.status_code, 400)
        mock_delay.assert_not_called()

    def test_ac007_oversized_message_returns_400_or_413(self):
        self.authenticate(self.member)
        oversized = "a" * (10 * 1024 + 1)
        with patch("chat.views.create_message_task.delay") as mock_delay:
            resp = self.client.post(self.url, {"room": str(self.room.id), "message": oversized}, format="json")
        self.assertIn(resp.status_code, (400, 413))
        mock_delay.assert_not_called()


class MessageListAndDetailAccessTests(APITestCase):
    def setUp(self):
        users = get_user_model()
        self.member = users.objects.create_user(username="list_member", password="test-password")
        self.room = Room.objects.create(name="List Room", created_by=self.member)
        self.membership = RoomMember.objects.create(room=self.room, user=self.member, role="ADMIN")
        self.msg = Message.objects.create(room=self.room, sender=self.member, message="Member message")
        self.null_msg = Message.objects.create(room=None, sender=self.member, message="Legacy null-room message")

    def authenticate(self, user):
        token = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_ac005_legacy_null_room_message_excluded_from_list_and_detail(self):
        self.authenticate(self.member)
        resp = self.client.get("/messages/")
        self.assertEqual(resp.status_code, 200)
        ids = [item["id"] for item in resp.data["results"]]
        self.assertIn(str(self.msg.id), ids)
        self.assertNotIn(str(self.null_msg.id), ids)

        detail_resp = self.client.get(f"/messages/{self.null_msg.id}/")
        self.assertEqual(detail_resp.status_code, 404)

    def test_ac005_former_member_cannot_list_or_retrieve_messages(self):
        self.membership.delete()
        self.authenticate(self.member)
        resp = self.client.get("/messages/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["results"], [])

        detail_resp = self.client.get(f"/messages/{self.msg.id}/")
        self.assertEqual(detail_resp.status_code, 404)


class WebSocketAccessTests(APITestCase):
    def setUp(self):
        users = get_user_model()
        self.member = users.objects.create_user(username="ws_member", password="test-password")
        self.outsider = users.objects.create_user(username="ws_outsider", password="test-password")
        self.room = Room.objects.create(name="WS Room", created_by=self.member)
        RoomMember.objects.create(room=self.room, user=self.member, role="ADMIN")
        self.headers = [(b"origin", b"http://testserver")]

    async def test_ac006_valid_member_ws_connection_accepted(self):
        token = str(RefreshToken.for_user(self.member).access_token)
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.room.id}/?token={token}",
            headers=self.headers,
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_ac006_outsider_ws_connection_rejected(self):
        token = str(RefreshToken.for_user(self.outsider).access_token)
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.room.id}/?token={token}",
            headers=self.headers,
        )
        connected, _ = await communicator.connect()
        self.assertFalse(connected)

    async def test_ac006_anonymous_ws_connection_rejected(self):
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.room.id}/",
            headers=self.headers,
        )
        connected, _ = await communicator.connect()
        self.assertFalse(connected)

    async def test_ac006_invalid_token_ws_connection_rejected(self):
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.room.id}/?token=invalid.jwt.token",
            headers=self.headers,
        )
        connected, _ = await communicator.connect()
        self.assertFalse(connected)

    async def test_ac006_malformed_room_ws_connection_rejected(self):
        token = str(RefreshToken.for_user(self.member).access_token)
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/not-a-valid-uuid/?token={token}",
            headers=self.headers,
        )
        connected, _ = await communicator.connect()
        self.assertFalse(connected)
