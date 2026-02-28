import time
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.integrations.email_client import EmailService
from apps.tickets.models import Ticket, Message

# Импорт функции и класса (убедись, что путь правильный)
from jarvis.app.services.pipeline import process_email


class Command(BaseCommand):
    help = 'Polls emails and processes them with Jarvis AI'

    def handle(self, *args, **options):
        self.stdout.write("Starting Email Poller & Jarvis AI...")

        email_service = EmailService()

        while True:
            try:
                # 1. Получаем письма
                emails = email_service.fetch_unseen_emails()

                if emails:
                    self.stdout.write(f"Found {len(emails)} new emails.")

                    for mail in emails:
                        # 2. Сохраняем тикет (статус NEW)
                        # Создаем тикет с данными из заголовков письма
                        ticket = Ticket.objects.create(
                            subject=mail['subject'],
                            sender_email=mail['sender_email'],
                            sender_name=mail['sender_name'],  # Имя из почты (заголовок From)
                            raw_body=mail['body'],
                            received_at=timezone.now(),
                            status=Ticket.Status.NEW
                        )

                        # Сохраняем первое сообщение
                        Message.objects.create(
                            ticket=ticket,
                            direction=Message.Direction.INBOUND,
                            sender=mail['sender_email'],
                            recipient=email_service.email_user,
                            subject=mail['subject'],
                            body_text=mail['body'],
                            sent_at=timezone.now()
                        )

                        self.stdout.write(f"Processing Ticket #{ticket.id}...")

                        # 3. ВЫЗЫВАЕМ JARVIS
                        try:
                            # Передаем тело письма
                            ai_result = process_email(ticket.raw_body)

                            if ai_result:
                                # 4. Обновляем тикет данными от AI
                                # Используем getattr, чтобы не упасть, если поле None или отсутствует

                                self.stdout.write(self.style.ERROR(f"Proccessed without errors"))
                                # Основные поля
                                ticket.category = getattr(ai_result, 'category', 'Другое') or 'Другое'
                                ticket.sentiment = getattr(ai_result, 'sentiment', 'neutral') or 'neutral'
                                ticket.confidence = getattr(ai_result, 'confidence', 0.0) or 0.0
                                ticket.ai_draft = getattr(ai_result, 'ai_draft', '') or ''
                                ticket.priority = 'medium'

                                # Сущности
                                ticket.phone = getattr(ai_result, 'phone', None)
                                ticket.object_name = getattr(ai_result, 'object_name', None)
                                ticket.serial_numbers = getattr(ai_result, 'serial_numbers', None)
                                ticket.device_type = getattr(ai_result, 'device_type', None)

                                # description УБРАЛИ (не сохраняем)

                                # Обновляем имя отправителя если нашли
                                ai_sender_name = getattr(ai_result, 'sender_name', None)
                                if ai_sender_name:
                                    ticket.sender_name = ai_sender_name

                                ticket.status = Ticket.Status.AWAITING_REPLY
                                ticket.save()

                                self.stdout.write(self.style.SUCCESS(
                                    f"Ticket #{ticket.id} AI processed! Category: {ticket.category}"))
                            else:
                                self.stdout.write(self.style.WARNING(f"Jarvis returned None for Ticket #{ticket.id}"))

                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f"Error inside Jarvis processing: {e}"))


                else:
                    # self.stdout.write("No emails...")
                    pass

                time.sleep(5)  # Пауза 5 сек

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Loop error: {e}"))
                time.sleep(5)