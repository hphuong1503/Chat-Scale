import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import RoomMember

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope.get('user')

        # 1. Check Authentication
        if not self.user or self.user.is_anonymous:
            await self.close()
            return

        # 2. Check Permission (Is user a member of this room?)
        is_member = await self.check_membership(self.user, self.room_id)
        if not is_member:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket (optional, if we want to support sending via WS)
    async def receive(self, text_data):
        pass

    # Receive message from room group
    async def chat_message(self, event):
        message = event.get('message')
        sender_id = event.get('sender_id')
        data = event.get('data')

        # Send message to WebSocket with public event envelope and legacy aliases
        await self.send(text_data=json.dumps({
            'type': 'message.created',
            'data': data,
            'message': message,
            'sender_id': str(sender_id) if sender_id is not None else None,
            'room_id': str(self.room_id),
        }))


    @database_sync_to_async
    def check_membership(self, user, room_id):
        try:
            return RoomMember.objects.filter(user=user, room_id=room_id).exists()
        except Exception:
            return False
