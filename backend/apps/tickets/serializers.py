from rest_framework import serializers
from .models import Ticket, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id', 'ticket_id', 'direction', 'sender',
            'recipient', 'subject', 'body_text', 'sent_at', 'created_at'
        ]


class TicketSerializer(serializers.ModelSerializer):
    # assigned_to убрали

    class Meta:
        model = Ticket
        fields = [
            'id', 'subject', 'sender_email', 'sender_name',
            'phone', 'object_name', 'serial_numbers', 'device_type',
            # description убрали

            'category',
            'priority', 'sentiment',
            'confidence', 'status', 'ai_draft',
            # assigned_to убрали

            'received_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']