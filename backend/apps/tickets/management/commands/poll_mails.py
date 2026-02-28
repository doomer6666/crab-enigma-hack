import time
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.integrations.email_client import EmailService
from apps.tickets.models import Ticket, Message

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

                        self.stdout.write(f"Processing Ticket #{ticket.id}...")

                        # 3. ВЫЗЫВАЕМ JARVIS

                        ai_result = process_email(ticket.raw_body)

                        if ai_result:
                            # 4. Обновляем тикет данными от AI
                            ticket.category = ai_result.get('category', 'Другое')
                            ticket.priority = ai_result.get('priority', 'medium')
                            ticket.sentiment = ai_result.get('sentiment', 'neutral')
                            ticket.confidence = ai_result.get('confidence', 0.0)
                            ticket.ai_draft = ai_result.get('ai_draft', '')

                            # Меняем статус
                            ticket.status = Ticket.Status.AI_PROCESSED
                            ticket.save()

                            self.stdout.write(self.style.SUCCESS(f"Ticket #{ticket.id} AI processed!"))
                        else:
                            self.stdout.write(self.style.WARNING(f"Jarvis failed on Ticket #{ticket.id}"))

                else:
                    # self.stdout.write("No emails...")
                    pass

                time.sleep(1)  # Пауза 10 сек

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Loop error: {e}"))
                time.sleep(5)