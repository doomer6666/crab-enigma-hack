from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Ticket, Message
from .serializers import TicketSerializer, MessageSerializer
from .pagination import StandardResultsSetPagination


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    pagination_class = StandardResultsSetPagination

    # Подключаем фильтрацию и поиск
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    # Поля для точного совпадения (?status=new&priority=high)
    filterset_fields = ['status', 'priority']

    # Поля для поиска (?search=ivanov)
    search_fields = ['subject', 'sender_email', 'sender_name', 'messages__text']

    # Дополнительный эндпоинт для переписки: /api/tickets/{id}/messages/
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        ticket = self.get_object()
        # Сортируем сообщения: сначала старые
        messages = ticket.messages.all().order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)