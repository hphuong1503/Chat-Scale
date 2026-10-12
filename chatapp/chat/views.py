from django.shortcuts import render, get_object_or_404
from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import get_user_model
import logging

from rest_framework import viewsets, parsers, status, decorators, permissions
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import Message, Room, RoomMember
from .serializer import MessageSerializer, RoomSerializer, RoomMemberSerializer
from .tasks import create_message_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)

# Sync with serializer / settings
MAX_MESSAGE_BYTES = 10 * 1024  # 10 KB
asyncapp = True

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by('-created_at')
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Room.objects.filter(members__user=self.request.user).order_by('-created_at').distinct()

    def get_object(self):
        try:
            return super().get_object()
        except DjangoValidationError:
            raise ValidationError({"detail": "Invalid room ID."})

    def create(self, request, *args, **kwargs):
        for key in ('id', 'created_by', 'role'):
            if key in request.data:
                return Response({"detail": f"Cannot specify '{key}' in payload."}, status=status.HTTP_400_BAD_REQUEST)

        room_type = request.data.get('room_type', 'GROUP')
        if room_type not in ('GROUP', 'DIRECT'):
            return Response({"detail": "Invalid room_type."}, status=status.HTTP_400_BAD_REQUEST)

        if room_type == 'DIRECT':
            if 'members' in request.data:
                return Response({"detail": "members cannot be specified for DIRECT room."}, status=status.HTTP_400_BAD_REQUEST)
            target_user_id = request.data.get('target_user_id')
            if not target_user_id:
                return Response({"detail": "target_user_id is required for DIRECT room."}, status=status.HTTP_400_BAD_REQUEST)

            if str(target_user_id) == str(request.user.id):
                return Response({"detail": "Cannot create direct room with yourself."}, status=status.HTTP_400_BAD_REQUEST)

            User = get_user_model()
            try:
                target_user = User.objects.filter(id=target_user_id, is_active=True).first()
            except (ValueError, TypeError):
                target_user = None

            if not target_user:
                return Response({"detail": "Invalid or inactive target user."}, status=status.HTTP_400_BAD_REQUEST)

            u1, u2 = sorted([request.user, target_user], key=lambda u: u.id)
            existing_room = Room.objects.filter(room_type='DIRECT', direct_user1=u1, direct_user2=u2).first()
            if existing_room:
                serializer = self.get_serializer(existing_room)
                return Response(serializer.data, status=status.HTTP_200_OK)

            try:
                with transaction.atomic():
                    room = Room.objects.create(
                        room_type='DIRECT',
                        created_by=request.user,
                        direct_user1=u1,
                        direct_user2=u2,
                        name=request.data.get('name') or f"Direct: {u1.username} & {u2.username}",
                        description=request.data.get('description', '')
                    )
                    RoomMember.objects.create(room=room, user=request.user, role='MEMBER')
                    RoomMember.objects.create(room=room, user=target_user, role='MEMBER')
                    room = Room.objects.prefetch_related('members__user').get(id=room.id)
                    serializer = self.get_serializer(room)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError:
                existing_room = Room.objects.filter(room_type='DIRECT', direct_user1=u1, direct_user2=u2).first()
                serializer = self.get_serializer(existing_room)
                return Response(serializer.data, status=status.HTTP_200_OK)

        # GROUP room
        if 'target_user_id' in request.data:
            return Response({"detail": "target_user_id cannot be specified for GROUP room."}, status=status.HTTP_400_BAD_REQUEST)

        members_raw = request.data.get('members', None)
        other_users = []
        if members_raw is not None:
            if not isinstance(members_raw, list):
                return Response({"detail": "members must be a list of user IDs."}, status=status.HTTP_400_BAD_REQUEST)
            deduped_ids = []
            seen = set()
            for uid in members_raw:
                if str(uid) == str(request.user.id):
                    continue
                if uid not in seen:
                    seen.add(uid)
                    deduped_ids.append(uid)

            User = get_user_model()
            for uid in deduped_ids:
                try:
                    target = User.objects.filter(id=uid, is_active=True).first()
                except (ValueError, TypeError):
                    target = None
                if not target:
                    return Response({"detail": f"Invalid or inactive user ID: {uid}."}, status=status.HTTP_400_BAD_REQUEST)
                other_users.append(target)

        with transaction.atomic():
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            room = serializer.save(created_by=request.user, room_type='GROUP')
            RoomMember.objects.create(room=room, user=request.user, role='ADMIN')
            for target in other_users:
                RoomMember.objects.create(room=room, user=target, role='MEMBER')
            room = Room.objects.prefetch_related('members__user').get(id=room.id)
            return Response(self.get_serializer(room).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        room = self.get_object()
        if room.room_type == 'DIRECT':
            return Response({"detail": "DIRECT rooms cannot be modified."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        membership = RoomMember.objects.filter(room=room, user=request.user).first()
        if not membership or membership.role != 'ADMIN':
            return Response({"detail": "Only ADMIN can modify the room."}, status=status.HTTP_403_FORBIDDEN)

        protected_fields = {'room_type', 'created_by', 'id', 'role', 'members'}
        for field in protected_fields:
            if field in request.data:
                return Response({"detail": f"Field '{field}' cannot be modified."}, status=status.HTTP_400_BAD_REQUEST)

        for key in request.data.keys():
            if key not in {'name', 'description'}:
                return Response({"detail": f"Field '{key}' is not allowed."}, status=status.HTTP_400_BAD_REQUEST)

        partial = kwargs.pop('partial', False)
        with transaction.atomic():
            serializer = self.get_serializer(room, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        room = self.get_object()
        if room.room_type == 'DIRECT':
            return Response({"detail": "DIRECT rooms cannot be deleted."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        membership = RoomMember.objects.filter(room=room, user=request.user).first()
        if not membership or membership.role != 'ADMIN':
            return Response({"detail": "Only ADMIN can delete the room."}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            room.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @decorators.action(detail=True, methods=['get', 'post'], url_path='members')
    def members(self, request, pk=None):
        room = self.get_object()
        if request.method == 'GET':
            members = RoomMember.objects.filter(room=room).select_related('user')
            serializer = RoomMemberSerializer(members, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        if request.method == 'POST':
            if room.room_type == 'DIRECT':
                return Response({"detail": "Cannot add members to DIRECT room."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

            membership = RoomMember.objects.filter(room=room, user=request.user).first()
            if not membership or membership.role != 'ADMIN':
                return Response({"detail": "Only Admin can add members"}, status=status.HTTP_403_FORBIDDEN)

            user_id = request.data.get('user_id')
            if not user_id:
                return Response({"detail": "user_id required"}, status=status.HTTP_400_BAD_REQUEST)

            User = get_user_model()
            try:
                target_user = User.objects.filter(id=user_id, is_active=True).first()
            except (ValueError, TypeError):
                target_user = None

            if not target_user:
                return Response({"detail": "Invalid or inactive user."}, status=status.HTTP_400_BAD_REQUEST)

            if RoomMember.objects.filter(room=room, user=target_user).exists():
                return Response({"detail": "User already in room"}, status=status.HTTP_400_BAD_REQUEST)

            RoomMember.objects.create(room=room, user=target_user, role='MEMBER')
            return Response({"status": "Member added"}, status=status.HTTP_200_OK)

    @decorators.action(detail=True, methods=['delete'], url_path=r'members/(?P<user_id>[^/.]+)')
    def remove_member(self, request, pk=None, user_id=None):
        room = self.get_object()
        if room.room_type == 'DIRECT':
            return Response({"detail": "Cannot remove members from DIRECT room."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        membership = RoomMember.objects.filter(room=room, user=request.user).first()
        if not membership or membership.role != 'ADMIN':
            return Response({"detail": "Only Admin can remove members"}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            locked_room = Room.objects.select_for_update().get(id=room.id)
            try:
                target_member = RoomMember.objects.select_for_update().get(room=locked_room, user_id=user_id)
            except (RoomMember.DoesNotExist, ValueError):
                return Response({"detail": "Member not found"}, status=status.HTTP_404_NOT_FOUND)

            if target_member.role == 'ADMIN':
                admin_count = RoomMember.objects.filter(room=locked_room, role='ADMIN').count()
                if admin_count <= 1:
                    return Response(
                        {"detail": "Cannot remove the last admin.", "code": "last_admin"},
                        status=status.HTTP_409_CONFLICT
                    )

            target_member.delete()
            return Response({"status": "Member removed"}, status=status.HTTP_200_OK)

    @decorators.action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        room = self.get_object()
        messages = Message.objects.filter(room=room).select_related('sender').order_by('-created_at')
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = MessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

class MessageViewSet(viewsets.ModelViewSet):
    """API endpoint that allows messages to be viewed or created."""

    queryset = Message.objects.all().order_by("-created_at")
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.JSONParser]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .select_related("sender")
            .filter(
                sender=self.request.user,
                room__isnull=False,
                room__members__user=self.request.user,
            )
        )

    def _validate_content_length(self, content_length):
        """Validate request payload size."""
        if content_length is not None:
            try:
                if int(content_length) > MAX_MESSAGE_BYTES:
                    return False
            except (ValueError, TypeError):
                pass
        return True

    def create(self, request, *args, **kwargs):
        """Create a new message asynchronously."""
        logger.info("self action: %s", self.action)
        content_length = request.META.get("CONTENT_LENGTH")
        if not self._validate_content_length(content_length):
            return Response(
                {"detail": "Payload too large."},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        room_id = serializer.validated_data['room']
        if isinstance(room_id, Room):
            room_id = room_id.id

        if not RoomMember.objects.filter(room_id=room_id, user=request.user).exists():
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        create_message_task.delay(
            sender_id=request.user.id,
            message=serializer.validated_data['message'],
            room_id=room_id,
        )

        return Response(
            {"status": "Message creation queued"},
            status=status.HTTP_202_ACCEPTED,
        )
