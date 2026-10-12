import uuid
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from .models import Message, Room, RoomMember

User = get_user_model()
MAX_MESSAGE_BYTES = 10 * 1024  # 10 KB

class RoomIdRelatedField(serializers.PrimaryKeyRelatedField):
    """
    Accepts any valid UUID on input without querying the database,
    allowing the view to distinguish nonexistent/unauthorized rooms (404)
    from malformed UUIDs (400).
    """
    def to_internal_value(self, data):
        try:
            return uuid.UUID(str(data))
        except (ValueError, TypeError, AttributeError):
            raise serializers.ValidationError(_("Must be a valid UUID."))

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class RoomMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = RoomMember
        fields = ['user', 'role', 'joined_at']

class RoomSerializer(serializers.ModelSerializer):
    members = RoomMemberSerializer(many=True, read_only=True)
    
    class Meta:
        model = Room
        fields = ['id', 'name', 'description', 'room_type', 'created_by', 'created_at', 'updated_at', 'members']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.HiddenField(default=serializers.CurrentUserDefault())
    room = RoomIdRelatedField(queryset=Room.objects.all())

    class Meta:
        model = Message
        fields = ("id", "sender", "message", "room", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_message(self, value):
        if not isinstance(value, str):
            raise serializers.ValidationError(_("Message must be a string."))

        b = len(value.encode("utf-8"))
        if b > MAX_MESSAGE_BYTES:
            raise serializers.ValidationError(
                _("Message too large (max {size} bytes).").format(size=MAX_MESSAGE_BYTES)
            )
        return value
