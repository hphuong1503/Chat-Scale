from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions, parsers, status, throttling
from rest_framework.response import Response
from .models import Message
from .serializer import MessageSerializer 

# Đồng bộ với serializer / settings
MAX_MESSAGE_BYTES = 10 * 1024  # 10 KB

# class MessageCreateThrottle(throttling.UserRateThrottle):
#     scope = "message_create"

class MessageViewSet(viewsets.ModelViewSet):
    """API endpoint that allows messages to be viewed or created."""

    queryset = Message.objects.all().order_by("-created_at")
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.JSONParser]
    # throttle_classes = [MessageCreateThrottle]
    http_method_names = ["get", "post", "head", "options"]


    def get_queryset(self):
        return super().get_queryset().filter(sender=self.request.user)

    def create(self, request, *args, **kwargs):
        content_length = request.META.get("CONTENT_LENGTH")
        if content_length is not None:
            try:
                if int(content_length) > MAX_MESSAGE_BYTES:
                    return Response(
                        {"detail": "Payload too large."},
                        status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    )
            except (ValueError, TypeError):
                pass

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from .tasks import create_message_task
        create_message_task.delay(
            sender_id=request.user.id,
            message=serializer.validated_data['message'],
            room_id=serializer.validated_data.get('room_id', 1)
        )

        return Response({"status": "Message creation queued"}, status=status.HTTP_202_ACCEPTED)
