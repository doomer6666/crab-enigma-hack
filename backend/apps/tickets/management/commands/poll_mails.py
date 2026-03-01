import time
import threading  # <--- Для параллельности
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.integrations.email_client import EmailService
from apps.tickets.models import Ticket, Message
from apps.integrations.telegram_client import send_telegram_alert

# Импорт функции Jarvis
from jarvis.app.services.pipeline import process_email


class Command(BaseCommand):
    help = 'Polls emails and processes them with Jarvis AI (Multithreaded)'

    def process_ticket_in_background(self, ticket_id):
        """
        Эта функция будет работать в отдельном потоке.
        Она берет ID тикета, прогоняет через AI и обновляет запись в БД.
        """
        try:
            # 1. Получаем тикет заново из БД (чтобы избежать конфликтов сессий)
            try:
                ticket = Ticket.objects.get(id=ticket_id)
            except Ticket.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"❌ Thread Error: Ticket #{ticket_id} not found"))
                return

            self.stdout.write(f"🧠 AI started thinking for Ticket #{ticket.id}...")

            # 2. ВЫЗЫВАЕМ JARVIS
            ai_result = process_email(ticket.raw_body)

            if ai_result:
                self.stdout.write(self.style.SUCCESS(f"✅ AI finished for Ticket #{ticket.id}"))

                # 3. Обновляем поля (используем getattr для безопасности)
                ticket.category = getattr(ai_result, 'category', 'Другое') or 'Другое'
                ticket.sentiment = getattr(ai_result, 'sentiment', 'neutral') or 'neutral'
                ticket.confidence = getattr(ai_result, 'confidence', 0.0) or 0.0
                ticket.ai_draft = getattr(ai_result, 'ai_draft', '') or ''
                # Priority в твоем классе нет, ставим дефолт
                ticket.priority = 'medium'

                # Сущности
                ticket.phone = getattr(ai_result, 'phone', None)
                ticket.object_name = getattr(ai_result, 'object_name', None)
                ticket.serial_numbers = getattr(ai_result, 'serial_numbers', None)
                ticket.device_type = getattr(ai_result, 'device_type', None)

                # Если AI нашел имя в подписи
                ai_sender_name = getattr(ai_result, 'sender_name', None)
                if ai_sender_name:
                    ticket.sender_name = ai_sender_name

                # 4. МЕНЯЕМ СТАТУС
                ticket.status = Ticket.Status.AWAITING_REPLY
                ticket.save()

                # 5. ОТПРАВЛЯЕМ УВЕДОМЛЕНИЕ (если негатив)
                if ticket.sentiment == 'negative' or ticket.priority == 'critical':
                    self.stdout.write(f"🔥 Ticket #{ticket.id} is NEGATIVE/CRITICAL! Sending Telegram alert...")
                    try:
                        send_telegram_alert(ticket)
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Telegram error: {e}"))

                self.stdout.write(self.style.SUCCESS(
                    f"💾 Ticket #{ticket.id} updated in DB! Category: {ticket.category}"
                ))

            else:
                self.stdout.write(self.style.WARNING(f"⚠️ Jarvis returned None for Ticket #{ticket.id}"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"🔥 Error in AI Thread for Ticket #{ticket_id}: {e}"))

    def handle(self, *args, **options):
        self.stdout.write("🚀 Starting Email Poller...")

        email_service = EmailService()

        while True:
            try:
                # 1. Получаем письма (это быстро)
                emails = email_service.fetch_unseen_emails()

                if emails:
                    self.stdout.write(f"📩 Found {len(emails)} new emails.")

                    for mail in emails:
                        # 2. МОМЕНТАЛЬНО сохраняем тикет (Status: NEW)
                        ticket = Ticket.objects.create(
                            subject=mail['subject'],
                            sender_email=mail['sender_email'],
                            sender_name=mail['sender_name'],
                            raw_body=mail['body'],
                            received_at=timezone.now(),
                            status=Ticket.Status.NEW
                        )

                        # Сохраняем сообщение
                        Message.objects.create(
                            ticket=ticket,
                            direction=Message.Direction.INBOUND,
                            sender=mail['sender_email'],
                            recipient=email_service.email_user,
                            subject=mail['subject'],
                            body_text=mail['body'],
                            sent_at=timezone.now()
                        )

                        self.stdout.write(f"📝 Ticket #{ticket.id} created. Starting AI thread...")

                        # 3. ЗАПУСКАЕМ AI В ОТДЕЛЬНОМ ПОТОКЕ
                        # Передаем ID тикета, а не объект, чтобы избежать проблем с БД в потоках
                        thread = threading.Thread(
                            target=self.process_ticket_in_background,
                            args=(ticket.id,)
                        )
                        thread.start()

                        # Цикл НЕ ЖДЕТ завершения потока и сразу идет к следующему письму

                time.sleep(5)  # Пауза между проверками почты

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"🔥 Main Loop Error: {e}"))
                time.sleep(5)