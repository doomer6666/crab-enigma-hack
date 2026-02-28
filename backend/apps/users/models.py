from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    is_editor = models.BooleanField(default=False, verbose_name="Может править базу знаний")

    def __str__(self):
        return self.username

class TelegramSubscriber(models.Model):
    chat_id = models.CharField(max_length=100, unique=True, verbose_name="ID чата")
    username = models.CharField(max_length=255, blank=True, null=True, verbose_name="Username")
    subscribed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.chat_id})"