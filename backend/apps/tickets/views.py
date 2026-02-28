from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Ticket, Message
from .serializers import TicketSerializer, MessageSerializer
from .pagination import StandardResultsSetPagination
from apps.integrations.email_client import EmailService


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    pagination_class = StandardResultsSetPagination

    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'priority']

    # Убрали description
    search_fields = [
        'subject', 'sender_email', 'sender_name',
        'object_name', 'serial_numbers', 'device_type',
        'phone'
    ]

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        ticket = self.get_object()
        messages = ticket.messages.all().order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        body_text = request.data.get('body_text', '')

        if not body_text:
            return Response({'success': False, 'detail': 'body_text is required'}, status=400)

        # 1. Отправка email
        email_service = EmailService()
        email_service.send_reply(
            to_email=ticket.sender_email,
            subject=ticket.subject,
            text=body_text
        )

        # 2. Сохранение сообщения
        Message.objects.create(
            ticket=ticket,
            direction=Message.Direction.OUTBOUND,
            sender=email_service.email_user,
            recipient=ticket.sender_email,
            subject=f"Re: {ticket.subject}",
            body_text=body_text,
            sent_at=timezone.now()
        )

        # 3. Смена статуса (ТЕПЕРЬ НА ОЖИДАНИЕ ОТВЕТА)
        ticket.status = Ticket.Status.IN_PROGRESS
        ticket.save()

        return Response({'success': True})