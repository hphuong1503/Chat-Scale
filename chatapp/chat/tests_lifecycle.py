"""
Acceptance tests for Room Lifecycle & Administration (Spec 003).
Covers AC-001 through AC-008.
"""
import uuid
from unittest.mock import MagicMock
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Room, RoomMember, Message
import importlib
migration_0004 = importlib.import_module("chat.migrations.0004_room_direct_user1_room_direct_user2_and_more")
preflight_and_backfill = migration_0004.preflight_and_backfill

User = get_user_model()


class BaseLifecycleTestCase:
    def authenticate(self, user):
        token = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")


class GroupCreationTests(BaseLifecycleTestCase, APITestCase):
    """AC-001: Atomic GROUP creation and deduplication."""

    def setUp(self):
        self.creator = User.objects.create_user(username="creator", password="pwd")
        self.bob = User.objects.create_user(username="bob", password="pwd")
        self.charlie = User.objects.create_user(username="charlie", password="pwd")
        self.inactive_user = User.objects.create_user(username="inactive", password="pwd", is_active=False)

    def test_ac001_group_creation_atomic_and_deduplicated(self):
        self.authenticate(self.creator)
        payload = {
            "name": "Engineering Team",
            "description": "Eng chat room",
            "room_type": "GROUP",
            "members": [self.bob.id, self.charlie.id],
        }
        resp = self.client.post("/rooms/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        room_id = resp.data["id"]

        room = Room.objects.get(id=room_id)
        self.assertEqual(room.name, "Engineering Team")
        self.assertEqual(room.created_by, self.creator)
        self.assertEqual(room.room_type, "GROUP")

        # Creator is ADMIN
        self.assertTrue(RoomMember.objects.filter(room=room, user=self.creator, role="ADMIN").exists())
        # Members are MEMBER
        self.assertTrue(RoomMember.objects.filter(room=room, user=self.bob, role="MEMBER").exists())
        self.assertTrue(RoomMember.objects.filter(room=room, user=self.charlie, role="MEMBER").exists())
        self.assertEqual(RoomMember.objects.filter(room=room).count(), 3)

        # Check serialized members in response
        returned_member_ids = [m["user"]["id"] for m in resp.data["members"]]
        self.assertIn(self.creator.id, returned_member_ids)
        self.assertIn(self.bob.id, returned_member_ids)
        self.assertIn(self.charlie.id, returned_member_ids)

    def test_ac001_group_creation_deduplicates_repeated_and_creator_ids(self):
        self.authenticate(self.creator)
        payload = {
            "name": "Deduplicated Group",
            "room_type": "GROUP",
            "members": [self.bob.id, self.bob.id, self.creator.id],
        }
        resp = self.client.post("/rooms/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        room = Room.objects.get(id=resp.data["id"])
        self.assertEqual(RoomMember.objects.filter(room=room).count(), 2)
        # Creator is still ADMIN, Bob is MEMBER
        self.assertTrue(RoomMember.objects.filter(room=room, user=self.creator, role="ADMIN").exists())
        self.assertTrue(RoomMember.objects.filter(room=room, user=self.bob, role="MEMBER").exists())

    def test_ac001_group_creation_invalid_member_rolls_back_all(self):
        self.authenticate(self.creator)
        initial_room_count = Room.objects.count()
        initial_member_count = RoomMember.objects.count()

        payload = {
            "name": "Failing Group",
            "room_type": "GROUP",
            "members": [self.bob.id, 99999],
        }
        resp = self.client.post("/rooms/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Room.objects.count(), initial_room_count)
        self.assertEqual(RoomMember.objects.count(), initial_member_count)

    def test_ac001_group_creation_inactive_member_rolls_back_all(self):
        self.authenticate(self.creator)
        initial_room_count = Room.objects.count()
        initial_member_count = RoomMember.objects.count()

        payload = {
            "name": "Inactive Member Group",
            "room_type": "GROUP",
            "members": [self.bob.id, self.inactive_user.id],
        }
        resp = self.client.post("/rooms/", payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Room.objects.count(), initial_room_count)
        self.assertEqual(RoomMember.objects.count(), initial_member_count)

    def test_ac001_group_creation_rejects_caller_controlled_fields(self):
        self.authenticate(self.creator)
        for field, val in [("created_by", self.bob.id), ("role", "ADMIN"), ("id", str(uuid.uuid4()))]:
            resp = self.client.post("/rooms/", {"name": "Test", field: val}, format="json")
            self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class RoomAdminPermissionMatrixTests(BaseLifecycleTestCase, APITestCase):
    """AC-002: Anonymous 401, outsider 404, member 403 on admin actions."""

    def setUp(self):
        self.admin = User.objects.create_user(username="admin", password="pwd")
        self.member = User.objects.create_user(username="member", password="pwd")
        self.outsider = User.objects.create_user(username="outsider", password="pwd")
        self.candidate = User.objects.create_user(username="candidate", password="pwd")

        self.room = Room.objects.create(name="Matrix Room", room_type="GROUP", created_by=self.admin)
        RoomMember.objects.create(room=self.room, user=self.admin, role="ADMIN")
        RoomMember.objects.create(room=self.room, user=self.member, role="MEMBER")
        self.message = Message.objects.create(room=self.room, sender=self.admin, message="Secret message")

    def test_ac002_anonymous_callers_receive_401(self):
        room_id = self.room.id
        self.assertEqual(self.client.post("/rooms/", {"name": "New"}).status_code, 401)
        self.assertEqual(self.client.get("/rooms/").status_code, 401)
        self.assertEqual(self.client.get(f"/rooms/{room_id}/").status_code, 401)
        self.assertEqual(self.client.patch(f"/rooms/{room_id}/", {"name": "Hacked"}).status_code, 401)
        self.assertEqual(self.client.delete(f"/rooms/{room_id}/").status_code, 401)
        self.assertEqual(self.client.post(f"/rooms/{room_id}/members/", {"user_id": self.candidate.id}).status_code, 401)
        self.assertEqual(self.client.delete(f"/rooms/{room_id}/members/{self.member.id}/").status_code, 401)

    def test_ac002_outsiders_receive_404(self):
        self.authenticate(self.outsider)
        room_id = self.room.id

        self.assertEqual(self.client.get(f"/rooms/{room_id}/").status_code, 404)
        self.assertEqual(self.client.patch(f"/rooms/{room_id}/", {"name": "Hacked"}).status_code, 404)
        self.assertEqual(self.client.delete(f"/rooms/{room_id}/").status_code, 404)
        self.assertEqual(self.client.post(f"/rooms/{room_id}/members/", {"user_id": self.candidate.id}).status_code, 404)
        self.assertEqual(self.client.delete(f"/rooms/{room_id}/members/{self.member.id}/").status_code, 404)

        # Nonexistent valid UUID also 404
        random_uuid = uuid.uuid4()
        self.assertEqual(self.client.get(f"/rooms/{random_uuid}/").status_code, 404)

        # State unchanged
        self.room.refresh_from_db()
        self.assertEqual(self.room.name, "Matrix Room")
        self.assertEqual(RoomMember.objects.filter(room=self.room).count(), 2)

    def test_ac002_member_receives_403_on_admin_operations(self):
        self.authenticate(self.member)
        room_id = self.room.id

        # Member can read room
        self.assertEqual(self.client.get(f"/rooms/{room_id}/").status_code, 200)

        # Member cannot update room
        self.assertEqual(self.client.patch(f"/rooms/{room_id}/", {"name": "Hacked"}).status_code, 403)
        # Member cannot delete room
        self.assertEqual(self.client.delete(f"/rooms/{room_id}/").status_code, 403)
        # Member cannot add member
        self.assertEqual(self.client.post(f"/rooms/{room_id}/members/", {"user_id": self.candidate.id}).status_code, 403)
        # Member cannot remove member
        self.assertEqual(self.client.delete(f"/rooms/{room_id}/members/{self.admin.id}/").status_code, 403)

        # State unchanged
        self.room.refresh_from_db()
        self.assertEqual(self.room.name, "Matrix Room")
        self.assertEqual(RoomMember.objects.filter(room=self.room).count(), 2)


class GroupAdminMutationsTests(BaseLifecycleTestCase, APITestCase):
    """AC-003: Allowed GROUP fields, protected field rejections, membership errors."""

    def setUp(self):
        self.admin = User.objects.create_user(username="admin", password="pwd")
        self.member = User.objects.create_user(username="member", password="pwd")
        self.new_user = User.objects.create_user(username="newuser", password="pwd")
        self.inactive_user = User.objects.create_user(username="inactive", password="pwd", is_active=False)

        self.room = Room.objects.create(name="Team Room", description="Original Desc", room_type="GROUP", created_by=self.admin)
        RoomMember.objects.create(room=self.room, user=self.admin, role="ADMIN")
        RoomMember.objects.create(room=self.room, user=self.member, role="MEMBER")

    def test_ac003_admin_updates_allowed_fields(self):
        self.authenticate(self.admin)
        resp = self.client.patch(f"/rooms/{self.room.id}/", {"name": "Renamed Room", "description": "New Desc"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.room.refresh_from_db()
        self.assertEqual(self.room.name, "Renamed Room")
        self.assertEqual(self.room.description, "New Desc")

    def test_ac003_admin_update_rejects_protected_fields_with_400(self):
        self.authenticate(self.admin)
        for field, val in [
            ("room_type", "DIRECT"),
            ("created_by", self.member.id),
            ("id", str(uuid.uuid4())),
            ("role", "ADMIN"),
            ("members", [self.new_user.id]),
        ]:
            resp = self.client.patch(f"/rooms/{self.room.id}/", {field: val}, format="json")
            self.assertEqual(resp.status_code, 400)

        # Verify state is unchanged
        self.room.refresh_from_db()
        self.assertEqual(self.room.name, "Team Room")
        self.assertEqual(self.room.room_type, "GROUP")

    def test_ac003_admin_adds_member_as_member_role(self):
        self.authenticate(self.admin)
        resp = self.client.post(f"/rooms/{self.room.id}/members/", {"user_id": self.new_user.id}, format="json")
        self.assertEqual(resp.status_code, 200)

        membership = RoomMember.objects.get(room=self.room, user=self.new_user)
        self.assertEqual(membership.role, "MEMBER")

    def test_ac003_admin_re_adding_existing_member_returns_400(self):
        self.authenticate(self.admin)
        resp = self.client.post(f"/rooms/{self.room.id}/members/", {"user_id": self.member.id}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_ac003_admin_adding_invalid_or_inactive_member_returns_400(self):
        self.authenticate(self.admin)
        self.assertEqual(self.client.post(f"/rooms/{self.room.id}/members/", {"user_id": 99999}, format="json").status_code, 400)
        self.assertEqual(self.client.post(f"/rooms/{self.room.id}/members/", {"user_id": self.inactive_user.id}, format="json").status_code, 400)

    def test_ac003_admin_removing_missing_member_returns_404(self):
        self.authenticate(self.admin)
        resp = self.client.delete(f"/rooms/{self.room.id}/members/{self.new_user.id}/")
        self.assertEqual(resp.status_code, 404)

    def test_ac003_admin_removes_regular_member_succeeds(self):
        self.authenticate(self.admin)
        resp = self.client.delete(f"/rooms/{self.room.id}/members/{self.member.id}/")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(RoomMember.objects.filter(room=self.room, user=self.member).exists())


class LastAdminProtectionTests(BaseLifecycleTestCase, APITestCase):
    """AC-004: Removing the last ADMIN returns 409 with code last_admin."""

    def setUp(self):
        self.admin1 = User.objects.create_user(username="admin1", password="pwd")
        self.admin2 = User.objects.create_user(username="admin2", password="pwd")
        self.member = User.objects.create_user(username="member", password="pwd")

        self.room = Room.objects.create(name="Multi-admin Room", room_type="GROUP", created_by=self.admin1)
        RoomMember.objects.create(room=self.room, user=self.admin1, role="ADMIN")
        RoomMember.objects.create(room=self.room, user=self.member, role="MEMBER")

    def test_ac004_sole_admin_self_removal_returns_409(self):
        self.authenticate(self.admin1)
        resp = self.client.delete(f"/rooms/{self.room.id}/members/{self.admin1.id}/")
        self.assertEqual(resp.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(resp.data.get("code"), "last_admin")
        self.assertTrue(RoomMember.objects.filter(room=self.room, user=self.admin1, role="ADMIN").exists())

    def test_ac004_admin_removal_allowed_when_another_admin_exists(self):
        # Add second ADMIN
        RoomMember.objects.create(room=self.room, user=self.admin2, role="ADMIN")
        self.authenticate(self.admin1)

        # Remove admin2
        resp = self.client.delete(f"/rooms/{self.room.id}/members/{self.admin2.id}/")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(RoomMember.objects.filter(room=self.room, user=self.admin2).exists())

        # Now admin1 is the sole admin -> removal rejected
        resp2 = self.client.delete(f"/rooms/{self.room.id}/members/{self.admin1.id}/")
        self.assertEqual(resp2.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(resp2.data.get("code"), "last_admin")


class DirectRoomLifecycleTests(BaseLifecycleTestCase, APITestCase):
    """AC-005, AC-006: DIRECT rooms creation, reuse, validation, and 405 on mutation."""

    def setUp(self):
        self.user_a = User.objects.create_user(username="user_a", password="pwd")
        self.user_b = User.objects.create_user(username="user_b", password="pwd")
        self.user_c = User.objects.create_user(username="user_c", password="pwd")
        self.inactive_user = User.objects.create_user(username="inactive", password="pwd", is_active=False)

    def test_ac005_direct_creation_and_reuse_forward_and_reverse(self):
        self.authenticate(self.user_a)
        resp1 = self.client.post("/rooms/", {"room_type": "DIRECT", "target_user_id": self.user_b.id}, format="json")
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)
        room_id = resp1.data["id"]

        room = Room.objects.get(id=room_id)
        self.assertEqual(room.room_type, "DIRECT")
        # Exactly two members
        self.assertEqual(RoomMember.objects.filter(room=room).count(), 2)
        self.assertTrue(RoomMember.objects.filter(room=room, user=self.user_a, role="MEMBER").exists())
        self.assertTrue(RoomMember.objects.filter(room=room, user=self.user_b, role="MEMBER").exists())

        # Calling again from user_a returns 200 and same room ID
        resp2 = self.client.post("/rooms/", {"room_type": "DIRECT", "target_user_id": self.user_b.id}, format="json")
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(resp2.data["id"], room_id)

        # Calling from user_b (reverse order) returns 200 and same room ID
        self.authenticate(self.user_b)
        resp3 = self.client.post("/rooms/", {"room_type": "DIRECT", "target_user_id": self.user_a.id}, format="json")
        self.assertEqual(resp3.status_code, status.HTTP_200_OK)
        self.assertEqual(resp3.data["id"], room_id)

        # Still only 1 room in DB
        self.assertEqual(Room.objects.filter(room_type="DIRECT").count(), 1)

    def test_ac005_direct_pair_integrity_error_fallback(self):
        from unittest.mock import patch
        from django.db import IntegrityError
        self.authenticate(self.user_a)
        resp1 = self.client.post("/rooms/", {"room_type": "DIRECT", "target_user_id": self.user_b.id}, format="json")
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)
        room_id = resp1.data["id"]

        # When concurrent worker causes IntegrityError during create, view handles it by fetching winner room
        with patch("chat.views.Room.objects.create", side_effect=IntegrityError("duplicate pair")):
            resp2 = self.client.post("/rooms/", {"room_type": "DIRECT", "target_user_id": self.user_b.id}, format="json")
            self.assertEqual(resp2.status_code, status.HTTP_200_OK)
            self.assertEqual(resp2.data["id"], room_id)

    def test_ac006_direct_validation_rejects_self_chat_and_invalid_targets(self):
        self.authenticate(self.user_a)

        # Self-chat returns 400
        resp_self = self.client.post("/rooms/", {"room_type": "DIRECT", "target_user_id": self.user_a.id}, format="json")
        self.assertEqual(resp_self.status_code, 400)

        # Inactive target returns 400
        resp_inactive = self.client.post("/rooms/", {"room_type": "DIRECT", "target_user_id": self.inactive_user.id}, format="json")
        self.assertEqual(resp_inactive.status_code, 400)

        # Nonexistent target returns 400
        resp_nonexistent = self.client.post("/rooms/", {"room_type": "DIRECT", "target_user_id": 99999}, format="json")
        self.assertEqual(resp_nonexistent.status_code, 400)

        # Missing target returns 400
        resp_missing = self.client.post("/rooms/", {"room_type": "DIRECT"}, format="json")
        self.assertEqual(resp_missing.status_code, 400)

        self.assertEqual(Room.objects.count(), 0)

    def test_ac006_direct_mutations_and_deletions_return_405(self):
        self.authenticate(self.user_a)
        resp = self.client.post("/rooms/", {"room_type": "DIRECT", "target_user_id": self.user_b.id}, format="json")
        room_id = resp.data["id"]

        # PATCH / PUT returns 405
        self.assertEqual(self.client.patch(f"/rooms/{room_id}/", {"name": "renamed"}).status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.put(f"/rooms/{room_id}/", {"name": "renamed"}).status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # DELETE room returns 405
        self.assertEqual(self.client.delete(f"/rooms/{room_id}/").status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # POST / DELETE members returns 405
        self.assertEqual(self.client.post(f"/rooms/{room_id}/members/", {"user_id": self.user_c.id}).status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(self.client.delete(f"/rooms/{room_id}/members/{self.user_b.id}/").status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class GroupDeletionCascadeTests(BaseLifecycleTestCase, APITestCase):
    """AC-007: Approved GROUP deletion policy - ADMIN 204 with atomic cascade."""

    def setUp(self):
        self.admin = User.objects.create_user(username="admin", password="pwd")
        self.member = User.objects.create_user(username="member", password="pwd")

        self.room = Room.objects.create(name="Delete Me", room_type="GROUP", created_by=self.admin)
        RoomMember.objects.create(room=self.room, user=self.admin, role="ADMIN")
        RoomMember.objects.create(room=self.room, user=self.member, role="MEMBER")
        self.msg = Message.objects.create(room=self.room, sender=self.admin, message="Will be deleted")

    def test_ac007_admin_deletes_group_with_cascade_to_members_and_messages(self):
        self.authenticate(self.admin)
        room_id = self.room.id

        resp = self.client.delete(f"/rooms/{room_id}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(Room.objects.filter(id=room_id).exists())
        self.assertFalse(RoomMember.objects.filter(room_id=room_id).exists())
        self.assertFalse(Message.objects.filter(room_id=room_id).exists())


class MigrationPreflightTests(APITestCase):
    """AC-008: Migration preflight detects ambiguous legacy data and migrates clean data."""

    def setUp(self):
        self.u1 = User.objects.create_user(username="u1", password="pwd")
        self.u2 = User.objects.create_user(username="u2", password="pwd")

    def test_ac008_preflight_detects_group_without_admin(self):
        group = Room.objects.create(name="Orphan Group", room_type="GROUP")
        RoomMember.objects.create(room=group, user=self.u1, role="MEMBER")

        apps_mock = MagicMock()
        apps_mock.get_model.side_effect = lambda app, model: Room if model == "Room" else RoomMember

        with self.assertRaises(RuntimeError) as ctx:
            preflight_and_backfill(apps_mock, None)
        self.assertIn("has no ADMIN", str(ctx.exception))

    def test_ac008_preflight_detects_duplicate_direct_pairs(self):
        u1, u2 = sorted([self.u1, self.u2], key=lambda u: u.id)
        r1 = Room.objects.create(room_type="DIRECT")
        RoomMember.objects.create(room=r1, user=u1, role="MEMBER")
        RoomMember.objects.create(room=r1, user=u2, role="MEMBER")

        r2 = Room.objects.create(room_type="DIRECT")
        RoomMember.objects.create(room=r2, user=u1, role="MEMBER")
        RoomMember.objects.create(room=r2, user=u2, role="MEMBER")

        apps_mock = MagicMock()
        apps_mock.get_model.side_effect = lambda app, model: Room if model == "Room" else RoomMember

        with self.assertRaises(RuntimeError) as ctx:
            preflight_and_backfill(apps_mock, None)
        self.assertIn("Duplicate DIRECT pairs", str(ctx.exception))

    def test_ac008_preflight_clean_data_backfills_normalized_pairs(self):
        u1, u2 = sorted([self.u1, self.u2], key=lambda u: u.id)
        # 1 valid group
        group = Room.objects.create(name="Valid Group", room_type="GROUP")
        RoomMember.objects.create(room=group, user=u1, role="ADMIN")

        # 1 valid direct room
        direct = Room.objects.create(room_type="DIRECT")
        RoomMember.objects.create(room=direct, user=u1, role="MEMBER")
        RoomMember.objects.create(room=direct, user=u2, role="MEMBER")

        apps_mock = MagicMock()
        apps_mock.get_model.side_effect = lambda app, model: Room if model == "Room" else RoomMember

        preflight_and_backfill(apps_mock, None)

        direct.refresh_from_db()
        self.assertEqual(direct.direct_user1, u1)
        self.assertEqual(direct.direct_user2, u2)


import threading
import unittest
from django.db import connection
from rest_framework.test import APIClient

@unittest.skipIf(connection.vendor == 'sqlite', "Concurrency tests require PostgreSQL row-level locking; SQLite locks entire database")
class ConcurrencyLifecycleTests(TransactionTestCase):
    """AC-004, AC-005: Concurrency and race conditions."""

    def setUp(self):
        self.user_a = User.objects.create_user(username="concur_a", password="pwd")
        self.user_b = User.objects.create_user(username="concur_b", password="pwd")

    def test_ac005_direct_pair_concurrency_race(self):
        token_a = str(RefreshToken.for_user(self.user_a).access_token)
        token_b = str(RefreshToken.for_user(self.user_b).access_token)

        results = []
        barrier = threading.Barrier(2)

        def create_a():
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_a}")
            barrier.wait()
            resp = client.post("/rooms/", {"room_type": "DIRECT", "target_user_id": self.user_b.id}, format="json")
            results.append(resp)

        def create_b():
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_b}")
            barrier.wait()
            resp = client.post("/rooms/", {"room_type": "DIRECT", "target_user_id": self.user_a.id}, format="json")
            results.append(resp)

        t1 = threading.Thread(target=create_a)
        t2 = threading.Thread(target=create_b)
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        self.assertEqual(len(results), 2)
        status_codes = sorted([r.status_code for r in results])
        self.assertEqual(status_codes, [200, 201])
        room_ids = [r.data["id"] for r in results]
        self.assertEqual(room_ids[0], room_ids[1])

        # Exactly 1 direct room in database
        self.assertEqual(Room.objects.filter(room_type="DIRECT").count(), 1)
        direct_room = Room.objects.get(id=room_ids[0])
        self.assertEqual(RoomMember.objects.filter(room=direct_room).count(), 2)

    def test_ac004_concurrent_admin_removal_protects_last_admin(self):
        room = Room.objects.create(name="Concurrency Admin Room", room_type="GROUP", created_by=self.user_a)
        RoomMember.objects.create(room=room, user=self.user_a, role="ADMIN")
        RoomMember.objects.create(room=room, user=self.user_b, role="ADMIN")

        token_a = str(RefreshToken.for_user(self.user_a).access_token)
        token_b = str(RefreshToken.for_user(self.user_b).access_token)

        results = []
        barrier = threading.Barrier(2)

        def remove_a():
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_a}")
            barrier.wait()
            resp = client.delete(f"/rooms/{room.id}/members/{self.user_a.id}/")
            results.append(resp)

        def remove_b():
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_b}")
            barrier.wait()
            resp = client.delete(f"/rooms/{room.id}/members/{self.user_b.id}/")
            results.append(resp)

        t1 = threading.Thread(target=remove_a)
        t2 = threading.Thread(target=remove_b)
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        self.assertEqual(len(results), 2)
        status_codes = sorted([r.status_code for r in results])
        self.assertEqual(status_codes, [200, 409])

        conflict_resp = next(r for r in results if r.status_code == 409)
        self.assertEqual(conflict_resp.data.get("code"), "last_admin")

        # Database state: exactly one ADMIN remains
        self.assertEqual(RoomMember.objects.filter(room=room, role="ADMIN").count(), 1)

