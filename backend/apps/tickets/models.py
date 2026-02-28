from django.db import models
from django.conf import settings


class Ticket(models.Model):
    # Статусы и Приоритеты оставим кодами (для логики цвета на фронте),
    # или тоже хочешь на русском? Пока оставил как в контракте (англ).
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

    # КАТЕГОРИИ (Ключ == Значение == Русский текст)
    class Category(models.TextChoices):
        MALFUNCTION = 'Неисправность', 'Неисправность'
        CALIBRATION = 'Калибровка', 'Калибровка'
        DOCS = 'Запрос документации', 'Запрос документации'
        SOFTWARE = 'Подключение и ПО', 'Подключение и ПО'
        PASSWORD = 'Запрос пароля', 'Запрос пароля'
        MOUNTING = 'Монтаж и установка', 'Монтаж и установка'
        WARRANTY = 'Гарантия и ремонт', 'Гарантия и ремонт'
        OTHER = 'Другое', 'Другое'

    # --- Поля ---
    subject = models.CharField(max_length=500, verbose_name="Тема")
    sender_email = models.EmailField(max_length=254, verbose_name="Email")
    sender_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="ФИО")

    phone = models.CharField(max_length=50, blank=True, null=True, verbose_name="Телефон")
    object_name = models.CharField(max_length=500, blank=True, null=True, verbose_name="Объект/Предприятие")
    serial_numbers = models.TextField(blank=True, null=True, verbose_name="Заводские номера")
    device_type = models.CharField(max_length=100, blank=True, null=True, verbose_name="Тип прибора")
    description = models.TextField(blank=True, null=True, verbose_name="Суть вопроса (AI)")

    # Просто строка с русским текстом
    category = models.CharField(
        max_length=100,
        choices=Category.choices,
        default=Category.OTHER,
        verbose_name="Категория"
    )

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    sentiment = models.CharField(max_length=20, choices=Sentiment.choices, default=Sentiment.NEUTRAL)
    confidence = models.FloatField(default=0.0, null=True)

    ai_draft = models.TextField(blank=True, null=True, verbose_name="Черновик AI")
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    received_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    raw_body = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"#{self.id} - {self.subject}"

    class Meta:
        ordering = ['-created_at']


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

    def __str__(self):
        return f"{self.direction} msg for ticket #{self.ticket_id}"