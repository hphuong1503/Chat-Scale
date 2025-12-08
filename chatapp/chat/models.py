import uuid
from django.db import models
from django.conf import settings

class Room(models.Model):
    ROOM_TYPES = (
        ('GROUP', 'Group Chat'),
        ('DIRECT', 'Direct Message'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES, default='GROUP')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_rooms")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name or str(self.id)

class RoomMember(models.Model):
    ROLES = (
        ('ADMIN', 'Admin'),
        ('MEMBER', 'Member'),
    )
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="room_memberships")
    role = models.CharField(max_length=10, choices=ROLES, default='MEMBER')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('room', 'user')

class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="messages", null=True)
    message = models.TextField()
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="messages")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender}: {self.message[:20]}..."
