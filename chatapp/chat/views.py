from django.shortcuts import render
import logging

from rest_framework import viewsets, parsers, status
from rest_framework.response import Response

from .models import Message
from .serializer import MessageSerializer
from .tasks import create_message_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)

# Sync with serializer / settings
MAX_MESSAGE_BYTES = 10 * 1024  # 10 KB
asyncapp = True

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
        
        create_message_task.delay(
                sender_id=user_id,
                message=serializer.validated_data['message'],
                room_id=serializer.validated_data.get('room_id', 1)
            )
        
        # if asyncapp == True:
        # # Queue message creation task
        #     logger.info(f"Creating message for user Celery: {user_id}")
            
        # else:
        #     try:
        #         logger.info(f"Creating message for user Sync: {user_id}")
        #         message_obj = Message.objects.create(
        #             sender_id=user_id,
        #             message=serializer.validated_data["message"],
        #             room_id=serializer.validated_data.get("room_id", 1),
        #         )
                
        #         # Send message to WebSocket group
        #         channel_layer = get_channel_layer()
        #         async_to_sync(channel_layer.group_send)(
        #             f'chat_{message_obj.room_id}',
        #             {
        #                 'type': 'chat_message',
        #                 'message': message_obj.message,
        #                 'sender_id': message_obj.sender_id,
        #                 'room_id': message_obj.room_id
        #             }
        #         )

        #     except Exception:
        #         logger.exception("Synchronous message creation failed")
        #         return Response(
        #             {"detail": "Failed to create message."},
        #             status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        #         )
            

        #     return Response(
        #     {"status": "Message creation queued"},
        #     status=status.HTTP_202_ACCEPTED
        #     )
        
        return Response(
            {"status": "Message creation queued"},
            status=status.HTTP_202_ACCEPTED
        )
