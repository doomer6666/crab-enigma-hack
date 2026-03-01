import imaplib
import time
from concurrent.futures import ThreadPoolExecutor  # <--- Пул потоков
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import close_old_connections  # <--- Важно для потоков

from apps.integrations.email_client import EmailService
from apps.tickets.models import Ticket, Message
from apps.integrations.telegram_client import send_telegram_alert

# Импорт функции Jarvis
from jarvis.app.services.pipeline import process_email

# Настройка количества параллельных потоков AI
# Для тяжелых моделей (BERT) ставь 1 или 2, иначе сервер упадет по памяти.
MAX_AI_WORKERS = 3


class Command(BaseCommand):
    help = 'Polls emails and processes them with Jarvis AI (Thread Pool)'

    def process_ticket_in_background(self, ticket_id):
        """
        Эта функция выполняется внутри воркера.
        """
        # Очищаем старые соединения с БД, чтобы не было ошибки "connection already closed"
        close_old_connections()

        try:
            try:
                ticket = Ticket.objects.get(id=ticket_id)
            except Ticket.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"❌ Thread Error: Ticket #{ticket_id} not found"))
                return

            self.stdout.write(f"🧠 Worker started processing Ticket #{ticket.id}...")

            # --- ВЫЗОВ AI (Тяжелая операция) ---
            ai_result = process_email(ticket.raw_body)

            if ai_result:
                # Обновляем поля
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

                ai_sender_name = getattr(ai_result, 'sender_name', None)
                if ai_sender_name:
                    ticket.sender_name = ai_sender_name

                # Меняем статус
                ticket.status = Ticket.Status.AWAITING_REPLY
                ticket.save()

                # Telegram Alert
                if ticket.sentiment == 'negative' or ticket.priority == 'critical':
                    self.stdout.write(f"🔥 Ticket #{ticket.id} NEGATIVE! Sending Telegram alert...")
                    try:
                        send_telegram_alert(ticket)
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Telegram error: {e}"))

                self.stdout.write(self.style.SUCCESS(
                    f"✅ AI Finished Ticket #{ticket.id}! Category: {ticket.category}"
                ))

            else:
                self.stdout.write(self.style.WARNING(f"⚠️ Jarvis returned None for Ticket #{ticket.id}"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"🔥 Error in AI Worker for Ticket #{ticket_id}: {e}"))
        finally:
            # Закрываем соединение после работы потока, чтобы не висело
            close_old_connections()

    def handle(self, *args, **options):
        self.stdout.write(f"🚀 Starting Email Poller with {MAX_AI_WORKERS} AI workers...")

        email_service = EmailService()

        # Создаем пул потоков (Очередь создается автоматически внутри Executor)
        with ThreadPoolExecutor(max_workers=MAX_AI_WORKERS) as executor:
            while True:
                try:
                    # 1. Получаем письма (в основном потоке)
                    emails = email_service.fetch_unseen_emails()

                    if emails:
                        self.stdout.write(f"📩 Found {len(emails)} new emails.")

                        for mail in emails:
                            # 2. Моментально сохраняем в БД
                            ticket = Ticket.objects.create(
                                subject=mail['subject'],
                                sender_email=mail['sender_email'],
                                sender_name=mail['sender_name'],
                                raw_body=mail['body'],
                                received_at=timezone.now(),
                                status=Ticket.Status.NEW
                            )

                            Message.objects.create(
                                ticket=ticket,
                                direction=Message.Direction.INBOUND,
                                sender=mail['sender_email'],
                                recipient=email_service.email_user,
                                subject=mail['subject'],
                                body_text=mail['body'],
                                sent_at=timezone.now()
                            )

                            self.stdout.write(f"📝 Ticket #{ticket.id} created. Added to AI Queue...")

                            # 3. ОТПРАВЛЯЕМ ЗАДАЧУ В ПУЛ
                            # Если воркеры свободны - начнется сразу.
                            # Если заняты - встанет в очередь.
                            executor.submit(self.process_ticket_in_background, ticket.id)

                    time.sleep(5)  # Пауза между проверками почты

                except KeyboardInterrupt:
                    self.stdout.write("Stopping...")
                    executor.shutdown(wait=False)
                    break
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"🔥 Main Loop Error: {e}"))
                    time.sleep(5)