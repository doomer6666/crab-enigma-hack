from rest_framework import serializers
from .models import Ticket, Category, Message
from apps.users.models import User

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'sender_email', 'text', 'is_incoming', 'created_at']

class TicketSerializer(serializers.ModelSerializer):
    # Вложенный объект для чтения
    category = CategorySerializer(read_only=True)
    # Поле ID для записи (PATCH запросы)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True
    )
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Ticket
        fields = [
            'id', 'subject', 'sender_email', 'sender_name',
            'category', 'category_id', # оба поля
            'priority', 'sentiment', 'confidence',
            'status', 'ai_draft', 'assigned_to',
            'received_at', 'created_at', 'updated_at'
        ]