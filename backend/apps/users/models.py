from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    is_editor = models.BooleanField(default=False, verbose_name="Может править базу знаний")

    def __str__(self):
        return self.username