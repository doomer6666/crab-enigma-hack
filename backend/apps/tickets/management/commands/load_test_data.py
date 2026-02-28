from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.tickets.models import Ticket, Message
import random
from datetime import timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Заполняет базу тестовыми данными для демо'

    def handle(self, *args, **kwargs):
        self.stdout.write("Очистка старых данных...")
        Message.objects.all().delete()
        Ticket.objects.all().delete()

        # Создаем админа, если нет, чтобы можно было назначить тикет
        admin, _ = User.objects.get_or_create(username='admin', defaults={'email': 'admin@example.com'})
        if not admin.check_password('admin'):
            admin.set_password('admin')
            admin.save()

        # Данные для генерации (Реальные кейсы)
        dataset = [
            {
                "subject": "Ложные срабатывания газоанализаторов при переменной температуре",
                "sender_name": "Смирнова Елена Александровна",
                "sender_email": "e.smirnova@gazprominvest.ru",
                "phone": "+7 (495) 111-22-33",
                "object_name": 'ООО "ГазПромИнвест"',
                "serial_numbers": "ГА-2024-0451, ГА-2024-0452",
                "device_type": "ЭРИС-210",
                "category": "Неисправность",
                "priority": "critical",
                "sentiment": "negative",
                "status": "ai_processed",
                "description": "Ложные тревоги при переменной температуре и повышенной влажности, показания до 10-15% НКПР.",
                "ai_draft": "Уважаемая Елена Александровна!\n\nВероятно, проблема связана с конденсатом на сенсоре.\nРекомендуем:\n1. Проверить герметичность\n2. Провести калибровку нуля\n\nС уважением, Техподдержка.",
                "confidence": 0.92
            },
            {
                "subject": "Запрос сертификатов и рекомендаций по монтажу",
                "sender_name": "Козлов Михаил Иванович",
                "sender_email": "m.kozlov@neftechim.ru",
                "phone": "+7 (846) 222-33-44",
                "object_name": 'ООО "Нефтехим-Пром"',
                "device_type": "ЭРИС-ФТ",
                "category": "Запрос документации",
                "priority": "low",
                "sentiment": "positive",
                "status": "resolved",
                "description": "Нужны сертификаты ATEX и руководство по монтажу для серии ФТ.",
                "ai_draft": "Уважаемый Михаил Иванович!\n\nВо вложении направляем запрошенные документы.\n\nС уважением, Техподдержка.",
                "confidence": 0.98
            },
            {
                "subject": "Ошибка E-04 на дисплее",
                "sender_name": "Игнатьев Дмитрий",
                "sender_email": "d.ignatev@lukoil.ru",
                "phone": "+7 (342) 111-22-33",
                "object_name": 'ЛУКОЙЛ-Пермь',
                "serial_numbers": "ЭР-ФТ-4511",
                "device_type": "ЭРИС-ФТ",
                "category": "Неисправность",
                "priority": "high",
                "sentiment": "negative",
                "status": "new",  # Новый, еще не обработан
                "description": "Прибор выдает ошибку сенсора E-04 и блокируется.",
                "ai_draft": "Уважаемый Дмитрий!\nОшибка E-04 означает отказ сенсора. Требуется замена.",
                "confidence": 0.89
            },
            {
                "subject": "ДГС BLE Android: не подходит пароль",
                "sender_name": "Петров Анатолий",
                "sender_email": "a.petrov@korgaz.ru",
                "phone": "+7 (922) 383-56-49",
                "object_name": 'АО "КОРГАЗ"',
                "device_type": "ДГС BLE",
                "category": "Запрос пароля",
                "priority": "medium",
                "sentiment": "neutral",
                "status": "ai_processed",
                "description": "Не могу зайти в приложение, стандартный пароль не подходит. ID: d88bb1b8978b",
                "ai_draft": "Для сброса пароля пришлите фото шильдика прибора.",
                "confidence": 0.95
            },
            {
                "subject": "Вопрос по поверке газоанализаторов",
                "sender_name": "Сидоров Иван",
                "sender_email": "ivanov@test.ru",
                "category": "Калибровка",
                "priority": "medium",
                "sentiment": "neutral",
                "status": "in_progress",  # В работе
                "description": "Как часто нужно делать поверку для ЭРИС-210?",
                "confidence": 0.85
            }
        ]

        for i, data in enumerate(dataset):
            # Сдвигаем время создания, чтобы они шли не в одну секунду
            created_time = timezone.now() - timedelta(hours=i * 2)

            ticket = Ticket.objects.create(
                subject=data['subject'],
                sender_email=data['sender_email'],
                sender_name=data.get('sender_name'),
                phone=data.get('phone'),
                object_name=data.get('object_name'),
                serial_numbers=data.get('serial_numbers'),
                device_type=data.get('device_type'),
                category=data['category'],  # Русская строка
                priority=data['priority'],
                sentiment=data['sentiment'],
                status=data['status'],
                description=data.get('description'),
                ai_draft=data.get('ai_draft'),
                confidence=data.get('confidence', 0.0),
                raw_body=f"Текст письма: {data.get('description')}\n\nС уважением, {data.get('sender_name')}",
                received_at=created_time
            )

            # Хак для изменения created_at (Django перезаписывает его при create)
            Ticket.objects.filter(id=ticket.id).update(created_at=created_time)

            # Создаем входящее сообщение
            Message.objects.create(
                ticket=ticket,
                direction='inbound',
                sender=ticket.sender_email,
                recipient='support@eriskip.com',
                subject=ticket.subject,
                body_text=ticket.raw_body,
                sent_at=created_time,
                created_at=created_time
            )

            # Если есть черновик или статус решен, добавим исходящее
            if data['status'] == 'resolved':
                Message.objects.create(
                    ticket=ticket,
                    direction='outbound',
                    sender='support@eriskip.com',
                    recipient=ticket.sender_email,
                    subject=f"Re: {ticket.subject}",
                    body_text=data.get('ai_draft'),
                    sent_at=created_time + timedelta(minutes=30),
                    created_at=created_time + timedelta(minutes=30)
                )

            self.stdout.write(f"Создан тикет: {ticket.subject}")

        self.stdout.write(self.style.SUCCESS(f'Успешно создано {len(dataset)} тикетов!'))