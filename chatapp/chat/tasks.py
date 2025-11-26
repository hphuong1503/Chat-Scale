from celery import shared_task
from django.contrib.auth import get_user_model
from .models import Message

@shared_task
def create_message_task(sender_id, message, room_id):
    User = get_user_model()
    try:
        user = User.objects.get(pk=sender_id)
        Message.objects.create(sender=user, message=message, room_id=room_id)
        return "Message created"
    except User.DoesNotExist:
        return "User not found"
