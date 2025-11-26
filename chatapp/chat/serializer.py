from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Message

MAX_MESSAGE_BYTES = 10 * 1024  # 10 KB

class MessageSerializer(serializers.ModelSerializer):
    # map hidden field -> model field 'sender' (server-set)
    sender = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Message
        # explicit whitelist
        fields = ("id", "sender", "message", "room_id", "created_at")
        read_only_fields = ("id", "created_at")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # incoming = {}
        # if hasattr(self, "initial_data") and self.initial_data is not None:
        #     try:
        #         incoming = set(self.initial_data.keys())
        #     except Exception:
        #         incoming = set()
        # writable = {
        #     name for name, field in self.fields.items()
        #     if (not getattr(field, "read_only", False)) and (not isinstance(field, serializers.HiddenField))
        # }
        # unexpected = incoming - writable
        # if unexpected:
        #     raise serializers.ValidationError({
        #         "detail": _("Unexpected or not-writable fields in request: ") + ", ".join(sorted(unexpected))
        #     })

    def validate_message(self, value):
        if not isinstance(value, str):
            raise serializers.ValidationError(_("Message must be a string."))

        b = len(value.encode("utf-8"))
        if b > MAX_MESSAGE_BYTES:
            raise serializers.ValidationError(
                _("Message too large (max {size} bytes).").format(size=MAX_MESSAGE_BYTES)
            )
        return value
