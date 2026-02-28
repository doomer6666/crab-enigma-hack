from rest_framework import serializers
from .models import Ticket, Message
from apps.users.models import User


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id', 'ticket_id', 'direction', 'sender',
            'recipient', 'subject', 'body_text', 'sent_at', 'created_at'
        ]


class TicketSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Ticket
        fields = [
            'id', 'subject', 'sender_email', 'sender_name',
            'phone', 'object_name', 'serial_numbers', 'device_type', 'description',

            'category',  # Вернет "Неисправность"

            'priority', 'sentiment',
            'confidence', 'status', 'ai_draft', 'assigned_to',
            'received_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']