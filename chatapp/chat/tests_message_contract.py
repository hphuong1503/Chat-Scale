import json
import uuid
from unittest.mock import AsyncMock, patch

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .consumers import ChatConsumer
from .models import Message, Room, RoomMember
from .serializer import (
    MAX_MESSAGE_BYTES,
    MessageSerializer,
    to_canonical_representation,
)

from .tasks import create_message_task
from .views import MessageViewSet


User = get_user_model()


class MessageContractAcceptanceTests(APITestCase):
    def setUp(self):
        self.member = User.objects.create_user(
            username="alice",
            email="alice@example.com",
            password="test-password-123",
        )
        self.outsider = User.objects.create_user(
            username="eve",
            email="eve@example.com",
            password="test-password-123",
        )
        self.room = Room.objects.create(name="Contract Room", created_by=self.member)
        RoomMember.objects.create(room=self.room, user=self.member, role="ADMIN")
        self.history_url = f"/rooms/{self.room.id}/messages/"

    def authenticate(self, user):
        token = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_ac001_canonical_message_fields_and_sender_privacy_history(self):
        """Authorized REST history responses contain canonical fields; sender exposes only id/username."""
        msg = Message.objects.create(
            room=self.room,
            sender=self.member,
            message="Canonical history test",
        )
        self.authenticate(self.member)
        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, 200)

        results = response.data["results"]
        self.assertEqual(len(results), 1)
        item = results[0]

        # Canonical fields present
        self.assertEqual(item["id"], str(msg.id))
        self.assertIsNone(item["client_message_id"])
        self.assertEqual(item["room_id"], str(self.room.id))
        self.assertEqual(item["content"], "Canonical history test")
        self.assertIn("created_at", item)
        self.assertTrue(item["created_at"].endswith("Z"))

        # Sender privacy: only id and username exposed
        sender = item["sender"]
        self.assertIsInstance(sender, dict)
        self.assertEqual(sender["id"], self.member.id)
        self.assertEqual(sender["username"], "alice")
        self.assertNotIn("email", sender)
        self.assertNotIn("password", sender)
        self.assertNotIn("groups", sender)
        self.assertNotIn("is_staff", sender)
        self.assertNotIn("is_superuser", sender)

    def test_ac001_canonical_message_fields_and_sender_privacy_list_and_detail(self):
        """Authorized REST message list and detail endpoints contain canonical fields and protect sender privacy."""
        msg = Message.objects.create(
            room=self.room,
            sender=self.member,
            message="Canonical list/detail test",
        )
        self.authenticate(self.member)

        # List endpoint
        list_resp = self.client.get("/messages/")
        self.assertEqual(list_resp.status_code, 200)
        matching = [m for m in list_resp.data["results"] if m["id"] == str(msg.id)]
        self.assertEqual(len(matching), 1)
        item = matching[0]
        self.assertEqual(item["content"], "Canonical list/detail test")
        self.assertEqual(item["room_id"], str(self.room.id))
        self.assertEqual(item["sender"], {"id": self.member.id, "username": "alice"})
        self.assertNotIn("email", item["sender"])

        # Detail endpoint
        detail_resp = self.client.get(f"/messages/{msg.id}/")
        self.assertEqual(detail_resp.status_code, 200)
        self.assertEqual(detail_resp.data["id"], str(msg.id))
        self.assertIsNone(detail_resp.data["client_message_id"])
        self.assertEqual(detail_resp.data["room_id"], str(self.room.id))
        self.assertEqual(detail_resp.data["content"], "Canonical list/detail test")
        self.assertEqual(
            detail_resp.data["sender"],
            {"id": self.member.id, "username": "alice"},
        )
        self.assertNotIn("email", detail_resp.data["sender"])

    def test_ac002_saved_message_rest_ws_equivalence(self):
        """Saved message WS data matches REST canonical fields identically (UUID, timestamp, sender, content)."""
        layer = AsyncMock()
        with patch("chat.tasks.get_channel_layer", return_value=layer):
            create_message_task.run(self.member.id, "Equivalence message", self.room.id)

        msg = Message.objects.get(room=self.room, message="Equivalence message")

        # REST read
        self.authenticate(self.member)
        rest_resp = self.client.get(f"/messages/{msg.id}/")
        self.assertEqual(rest_resp.status_code, 200)
        rest_data = rest_resp.data

        # WS broadcast event captured by group_send
        layer.group_send.assert_awaited_once()
        group_call_args = layer.group_send.await_args[0]
        group_name, ws_event = group_call_args
        self.assertEqual(group_name, f"chat_{self.room.id}")
        self.assertEqual(ws_event["type"], "chat_message")
        self.assertEqual(ws_event["message"], "Equivalence message")
        self.assertEqual(ws_event["sender_id"], str(self.member.id))
        self.assertEqual(ws_event["room_id"], str(self.room.id))

        # Check canonical data in WS event matches REST canonical fields
        canonical_ws_data = ws_event["data"]
        self.assertEqual(canonical_ws_data["id"], str(msg.id))
        self.assertEqual(canonical_ws_data["id"], rest_data["id"])
        self.assertEqual(canonical_ws_data["client_message_id"], rest_data["client_message_id"])
        self.assertEqual(canonical_ws_data["room_id"], rest_data["room_id"])
        self.assertEqual(canonical_ws_data["sender"], rest_data["sender"])
        self.assertEqual(canonical_ws_data["content"], rest_data["content"])
        self.assertEqual(canonical_ws_data["created_at"], rest_data["created_at"])

        # Test consumer transmission payload format
        consumer = ChatConsumer()
        consumer.room_id = str(self.room.id)
        consumer.send = AsyncMock()

        import asyncio
        asyncio.run(consumer.chat_message(ws_event))

        consumer.send.assert_awaited_once()
        sent_payload = json.loads(consumer.send.await_args[1]["text_data"])
        self.assertEqual(sent_payload["type"], "message.created")
        self.assertEqual(sent_payload["data"], canonical_ws_data)
        self.assertEqual(sent_payload["message"], "Equivalence message")
        self.assertEqual(sent_payload["sender_id"], str(self.member.id))
        self.assertEqual(sent_payload["room_id"], str(self.room.id))

    def test_ac003_legacy_send_contract_unchanged(self):
        """Existing POST {message, room} input returns 202 queued; no response claims saved/delivered."""
        self.authenticate(self.member)
        with patch("chat.views.create_message_task.delay") as mock_delay:
            resp = self.client.post(
                "/messages/",
                {"room": str(self.room.id), "message": "Legacy enqueue text"},
                format="json",
            )
        self.assertEqual(resp.status_code, 202)
        self.assertEqual(resp.data, {"status": "Message creation queued"})
        mock_delay.assert_called_once_with(
            sender_id=self.member.id,
            message="Legacy enqueue text",
            room_id=self.room.id,
        )
        # Message is not saved until task executes
        self.assertFalse(Message.objects.filter(message="Legacy enqueue text").exists())

    def test_ac004_legacy_unicode_and_timestamp_serialization(self):
        """Legacy rows serialize client_message_id as null; UTF-8 content and UTC timestamps round-trip faithfully."""
        unicode_content = "Xin chào thế giới! 🚀 🇻🇳 \n\t   leading and trailing spaces   "
        msg = Message.objects.create(
            room=self.room,
            sender=self.member,
            message=unicode_content,
        )
        canonical = to_canonical_representation(msg)
        self.assertIsNone(canonical["client_message_id"])
        self.assertEqual(canonical["content"], unicode_content)
        self.assertTrue(canonical["created_at"].endswith("Z"))

        self.authenticate(self.member)
        resp = self.client.get(f"/messages/{msg.id}/")
        self.assertEqual(resp.status_code, 200)
        self.assertIsNone(resp.data["client_message_id"])
        self.assertEqual(resp.data["content"], unicode_content)
        self.assertEqual(resp.data["created_at"], canonical["created_at"])

    def test_ac005_legacy_read_aliases_pagination_and_permission_matrix(self):
        """REST responses include backward-compatible aliases and pagination wrappers; unauthorized access yields no data."""
        msg = Message.objects.create(
            room=self.room,
            sender=self.member,
            message="Alias test",
        )
        self.authenticate(self.member)
        resp = self.client.get(self.history_url)
        self.assertEqual(resp.status_code, 200)

        # Pagination wrapper structure
        self.assertIn("count", resp.data)
        self.assertIn("next", resp.data)
        self.assertIn("previous", resp.data)
        self.assertIn("results", resp.data)

        item = resp.data["results"][0]
        # Legacy aliases agreement
        self.assertEqual(item["message"], item["content"])
        self.assertEqual(item["room"], item["room_id"])
        self.assertEqual(item["sender_id"], item["sender"]["id"])

        # Outsider gets 404 and receives no message or sender data
        self.authenticate(self.outsider)
        outsider_resp = self.client.get(self.history_url)
        self.assertEqual(outsider_resp.status_code, 404)
        self.assertNotIn("Alias test", str(outsider_resp.data))
        self.assertNotIn("alice", str(outsider_resp.data))

        # Anonymous gets 401
        self.client.credentials()  # Clear auth
        anon_resp = self.client.get(self.history_url)
        self.assertEqual(anon_resp.status_code, 401)

    def test_ac007_utf8_and_json_body_boundaries(self):
        """Content exactly at 10240 UTF-8 bytes is accepted by serializer; 10241 bytes fails with 400; Content-Length > 10240 returns 413."""
        self.authenticate(self.member)

        # 1. Serializer boundary verification: exactly 10240 UTF-8 bytes is valid, 10241 is invalid
        valid_10k_str = "a" * MAX_MESSAGE_BYTES
        self.assertEqual(len(valid_10k_str.encode("utf-8")), MAX_MESSAGE_BYTES)
        mock_request = type("Req", (), {"user": self.member})()
        s_valid = MessageSerializer(
            data={"room": str(self.room.id), "message": valid_10k_str},
            context={"request": mock_request},
        )
        self.assertTrue(s_valid.is_valid(), s_valid.errors)

        invalid_10k_str = "a" * (MAX_MESSAGE_BYTES + 1)
        self.assertEqual(len(invalid_10k_str.encode("utf-8")), MAX_MESSAGE_BYTES + 1)
        s_invalid = MessageSerializer(
            data={"room": str(self.room.id), "message": invalid_10k_str},
            context={"request": mock_request},
        )
        self.assertFalse(s_invalid.is_valid())
        self.assertIn("message", s_invalid.errors)

        # 2. HTTP POST with body within 10 KiB envelope -> 202 Accepted
        # (Content sized so entire JSON payload is <= 10240 bytes)
        safe_msg = "a" * (MAX_MESSAGE_BYTES - 200)
        with patch("chat.views.create_message_task.delay") as mock_delay:
            resp = self.client.post(
                "/messages/",
                {"room": str(self.room.id), "message": safe_msg},
                format="json",
            )
        self.assertEqual(resp.status_code, 202)
        mock_delay.assert_called_once()

        # 3. HTTP POST where message exceeds 10 KiB and payload passes Content-Length check -> 400 Bad Request
        with patch.object(
            MessageViewSet,
            "_validate_content_length",
            return_value=True,
        ):
            with patch("chat.views.create_message_task.delay") as mock_delay:
                resp = self.client.post(
                    "/messages/",
                    {"room": str(self.room.id), "message": invalid_10k_str},
                    format="json",
                )
            self.assertEqual(resp.status_code, 400)
            self.assertIn("message", resp.data)
            mock_delay.assert_not_called()


        # 4. HTTP POST where Content-Length header > 10240 -> 413 Payload Too Large
        with patch("chat.views.create_message_task.delay") as mock_delay:
            resp = self.client.post(
                "/messages/",
                {"room": str(self.room.id), "message": "short message"},
                format="json",
                CONTENT_LENGTH=str(MAX_MESSAGE_BYTES + 1),
            )
        self.assertEqual(resp.status_code, 413)
        mock_delay.assert_not_called()

