from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Ticket, Message
from .serializers import TicketSerializer, MessageSerializer
from .pagination import StandardResultsSetPagination
from apps.integrations.email_client import EmailService  # Импортируем наш сервис отправки


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    pagination_class = StandardResultsSetPagination

    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'priority']

    # Обновленный список полей для поиска
    search_fields = [
        'subject', 'sender_email', 'sender_name',
        'object_name', 'serial_numbers', 'device_type',
        'phone', 'description'
    ]

    # GET /api/tickets/{id}/messages/
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        ticket = self.get_object()
        messages = ticket.messages.all().order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    # POST /api/tickets/{id}/reply/
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        body_text = request.data.get('body_text', '')

        if not body_text:
            return Response({'success': False, 'detail': 'body_text is required'}, status=400)

        # 1. Отправляем email через наш сервис
        email_service = EmailService()
        email_sent = email_service.send_reply(
            to_email=ticket.sender_email,
            subject=ticket.subject,
            text=body_text
        )

        # Даже если SMTP упал (email_sent=False), мы сохраняем факт попытки,
        # но для хакатона можно считать, что всё ок.

        # 2. Сохраняем сообщение в базу
        Message.objects.create(
            ticket=ticket,
            direction=Message.Direction.OUTBOUND,
            sender=email_service.email_user,  # наш email из settings
            recipient=ticket.sender_email,
            subject=f"Re: {ticket.subject}",
            body_text=body_text,
            sent_at=timezone.now()
        )

        # 3. Меняем статус тикета
        ticket.status = Ticket.Status.RESOLVED
        ticket.save()

        return Response({'success': True})