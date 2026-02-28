from django.db import models
from django.conf import settings


class Ticket(models.Model):
    class Status(models.TextChoices):
        NEW = 'new', 'Новый'
        AI_PROCESSED = 'ai_processed', 'Обработан AI'
        IN_PROGRESS = 'in_progress', 'В работе'
        AWAITING_REPLY = 'awaiting_reply', 'Ожидает ответа'  # <--- Этот статус будем ставить
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

    class Category(models.TextChoices):
        MALFUNCTION = 'Неисправность', 'Неисправность'
        CALIBRATION = 'Калибровка', 'Калибровка'
        DOCS = 'Запрос документации', 'Запрос документации'
        SOFTWARE = 'Подключение и ПО', 'Подключение и ПО'
        PASSWORD = 'Запрос пароля', 'Запрос пароля'
        MOUNTING = 'Монтаж и установка', 'Монтаж и установка'
        WARRANTY = 'Гарантия и ремонт', 'Гарантия и ремонт'
        OTHER = 'Другое', 'Другое'

    # --- Основные поля ---
    subject = models.CharField(max_length=500, verbose_name="Тема")
    sender_email = models.EmailField(max_length=254, verbose_name="Email")
    sender_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="ФИО")

    # --- Специфика ---
    phone = models.CharField(max_length=50, blank=True, null=True, verbose_name="Телефон")
    object_name = models.CharField(max_length=500, blank=True, null=True, verbose_name="Объект")
    serial_numbers = models.TextField(blank=True, null=True, verbose_name="Заводские номера")
    device_type = models.CharField(max_length=100, blank=True, null=True, verbose_name="Тип прибора")

    # description УДАЛИЛИ

    # --- Метаданные ---
    category = models.CharField(max_length=100, choices=Category.choices, default=Category.OTHER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    sentiment = models.CharField(max_length=20, choices=Sentiment.choices, default=Sentiment.NEUTRAL)
    confidence = models.FloatField(default=0.0, null=True)

    ai_draft = models.TextField(blank=True, null=True)

    # assigned_to УДАЛИЛИ

    received_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    raw_body = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"#{self.id} - {self.subject}"

    class Meta:
        ordering = ['-created_at']


# Message оставляем без изменений
class Message(models.Model):
    class Direction(models.TextChoices):
        INBOUND = 'inbound', 'Входящее'
        OUTBOUND = 'outbound', 'Исходящее'

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages')
    direction = models.CharField(max_length=10, choices=Direction.choices)
    sender = models.CharField(max_length=255)
    recipient = models.CharField(max_length=255)
    subject = models.CharField(max_length=500, blank=True, null=True)
    body_text = models.TextField(blank=True, null=True)
    sent_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)