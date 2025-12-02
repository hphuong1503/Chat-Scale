from celery import shared_task
from django.contrib.auth import get_user_model
from django.db import connection
from django.utils import timezone
import uuid
from .models import Message
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@shared_task
def create_message_task(sender_id, message, room_id):

    Message.objects.create(sender_id=sender_id, message=message, room_id=room_id)
    
    # Send message to WebSocket group
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'chat_{room_id}',
        {
            'type': 'chat_message',
            'message': message,
            'sender_id': sender_id,
            'room_id': room_id
        }
    )
    return "Message created"

@shared_task
def create_message_raw_sql_task(sender_id, message, room_id):
    with connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO chat_message (id, sender_id, message, room_id, created_at) VALUES (%s, %s, %s, %s, %s)",
            [str(uuid.uuid4()), sender_id, message, room_id, timezone.now()]
        )
    return "Message created via Raw SQL"

