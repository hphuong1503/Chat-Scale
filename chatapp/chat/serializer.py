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

def to_canonical_representation(instance):
    """
    Serializes a Message instance to its canonical DTO (Spec 004):
    {
        "id": "<message UUID>",
        "client_message_id": null,
        "room_id": "<room UUID>",
        "sender": {"id": int, "username": str},
        "content": str,
        "created_at": "<persisted UTC ISO-8601 timestamp>",
    }
    """
    if instance is None:
        return None

    created_at_repr = (
        serializers.DateTimeField().to_representation(instance.created_at)
        if instance.created_at
        else None
    )
    room_id_str = str(instance.room_id) if instance.room_id is not None else None

    sender_repr = None
    if hasattr(instance, "sender") and instance.sender:
        sender_repr = {
            "id": instance.sender.id,
            "username": instance.sender.username,
        }

    return {
        "id": str(instance.id),
        "client_message_id": None,
        "room_id": room_id_str,
        "sender": sender_repr,
        "content": instance.message,
        "created_at": created_at_repr,
    }


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

    def to_representation(self, instance):
        canonical = to_canonical_representation(instance)
        if canonical is None:
            return {}
        # Retain backward-compatible legacy aliases:
        # message == content, room == room_id, sender_id == sender['id']
        canonical["message"] = canonical["content"]
        canonical["room"] = canonical["room_id"]
        canonical["sender_id"] = (
            canonical["sender"]["id"] if canonical["sender"] else None
        )
        return canonical

