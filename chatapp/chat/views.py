from django.shortcuts import render, get_object_or_404
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
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Room.objects.filter(members__user=self.request.user)

    def create(self, request, *args, **kwargs):
        room_type = request.data.get('room_type', 'GROUP')
        
        if room_type == 'DIRECT':
            target_user_id = request.data.get('target_user_id')
            if not target_user_id:
                raise ValidationError({"detail": "target_user_id is required for DIRECT room."})
            
            existing_room = Room.objects.filter(room_type='DIRECT').filter(members__user=self.request.user).filter(members__user__id=target_user_id).first()
            
            if existing_room:
                serializer = self.get_serializer(existing_room)
                return Response(serializer.data)
            
            room = Room.objects.create(room_type='DIRECT', created_by=self.request.user)
            RoomMember.objects.create(room=room, user=self.request.user, role='MEMBER')
            try:
                RoomMember.objects.create(room=room, user_id=target_user_id, role='MEMBER')
            except Exception:
                room.delete()
                raise ValidationError({"detail": "Invalid target_user_id"})
            
            serializer = self.get_serializer(room)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        room = serializer.save(created_by=self.request.user)
        RoomMember.objects.create(room=room, user=self.request.user, role='ADMIN')
        
        # Logic add members for GROUP room
        if room.room_type == 'GROUP':
            members = self.request.data.get('members')
            if members and isinstance(members, list):
                for user_id in members:
                    # Skip if adding self (already added as ADMIN)
                    if str(user_id) == str(self.request.user.id):
                        continue
                    try:
                        RoomMember.objects.create(room=room, user_id=user_id, role='MEMBER')
                    except Exception:
                        # Ignore invalid users or duplicates
                        pass

    @decorators.action(detail=True, methods=['get', 'post'], url_path='members')
    def members(self, request, pk=None):
        room = self.get_object()
        if request.method == 'GET':
            members = RoomMember.objects.filter(room=room)
            serializer = RoomMemberSerializer(members, many=True)
            return Response(serializer.data)
        
        if request.method == 'POST':
            user_id = request.data.get('user_id')
            if not user_id:
                return Response({"detail": "user_id required"}, status=status.HTTP_400_BAD_REQUEST)
            
            if room.room_type == 'DIRECT':
                 return Response({"detail": "Cannot add members to DIRECT room"}, status=status.HTTP_400_BAD_REQUEST)

            membership = RoomMember.objects.filter(room=room, user=request.user).first()
            if not membership or membership.role != 'ADMIN':
                 return Response({"detail": "Only Admin can add members"}, status=status.HTTP_403_FORBIDDEN)

            if RoomMember.objects.filter(room=room, user_id=user_id).exists():
                return Response({"detail": "User already in room"}, status=status.HTTP_400_BAD_REQUEST)

            RoomMember.objects.create(room=room, user_id=user_id, role='MEMBER')
            return Response({"status": "Member added"})

    @decorators.action(detail=True, methods=['delete'], url_path='members/(?P<user_id>[^/.]+)')
    def remove_member(self, request, pk=None, user_id=None):
        room = self.get_object()
        if room.room_type == 'DIRECT':
             return Response({"detail": "Cannot remove members from DIRECT room"}, status=status.HTTP_400_BAD_REQUEST)

        membership = RoomMember.objects.filter(room=room, user=request.user).first()
        if not membership or membership.role != 'ADMIN':
             return Response({"detail": "Only Admin can remove members"}, status=status.HTTP_403_FORBIDDEN)

        try:
            member_to_remove = RoomMember.objects.get(room=room, user_id=user_id)
            member_to_remove.delete()
            return Response({"status": "Member removed"})
        except RoomMember.DoesNotExist:
            return Response({"detail": "Member not found"}, status=status.HTTP_404_NOT_FOUND)

    @decorators.action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        room = self.get_object()
        messages = Message.objects.filter(room=room).order_by('-created_at')
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
    parser_classes = [parsers.JSONParser]
    def get_queryset(self):
        return super().get_queryset().filter(sender=self.request.user)

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
        # Validate content length
        content_length = request.META.get("CONTENT_LENGTH")
        if not self._validate_content_length(content_length):
            return Response(
                {"detail": "Payload too large."},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        # Validate request data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get user_id from JWT token (decoded by middleware, no DB query)
        user_id = getattr(request, 'jwt_user_id', None)
        if not user_id:
            return Response(
                {"detail": "Authorization required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        room = serializer.validated_data['room']
        create_message_task.delay(
                sender_id=user_id,
                message=serializer.validated_data['message'],
                room_id=room.id
            )
        
        return Response(
            {"status": "Message creation queued"},
            status=status.HTTP_202_ACCEPTED
        )
