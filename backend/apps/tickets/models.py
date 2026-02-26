from django.db import models
from django.conf import settings


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Ticket(models.Model):
    # Обновленные статусы из контракта
    class Status(models.TextChoices):
        NEW = 'new', 'Новый'
        AI_PROCESSED = 'ai_processed', 'Обработан AI'
        IN_PROGRESS = 'in_progress', 'В работе'
        AWAITING_REPLY = 'awaiting_reply', 'Ожидает ответа'
        RESOLVED = 'resolved', 'Решён'
        CLOSED = 'closed', 'Закрыт'

    class Priority(models.TextChoices):
        LOW = 'low', 'Низкий'
        MEDIUM = 'medium', 'Средний'
        HIGH = 'high', 'Высокий'
        CRITICAL = 'critical', 'Критический'

    class Sentiment(models.TextChoices):
        POSITIVE = 'positive', 'Позитивный'
        NEUTRAL = 'neutral', 'Нейтральный'
        NEGATIVE = 'negative', 'Негативный'

    subject = models.CharField(max_length=255)
    sender_email = models.EmailField()
    sender_name = models.CharField(max_length=255, blank=True, null=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='tickets')

    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    sentiment = models.CharField(max_length=20, choices=Sentiment.choices, default=Sentiment.NEUTRAL)

    # Переименовали под контракт
    confidence = models.FloatField(default=0.0, null=True)
    ai_draft = models.TextField(blank=True, null=True)

    # Время получения письма (из заголовков почты)
    received_at = models.DateTimeField(null=True, blank=True)
    # Время создания тикета в системе
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"#{self.id} - {self.subject}"

    class Meta:
        ordering = ['-created_at']  # Сортировка по умолчанию (новые сверху)


class Message(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages')
    sender_email = models.EmailField()
    text = models.TextField()
    is_incoming = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message {self.id} for Ticket {self.ticket_id}"