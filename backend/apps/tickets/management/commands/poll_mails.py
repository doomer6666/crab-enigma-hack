import time
from django.core.management.base import BaseCommand
from integrations.email_client import EmailService
from tickets.models import Ticket, Message
from django.utils import timezone


class Command(BaseCommand):
    help = 'Запускает бесконечный цикл опроса почты'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting email polling service...'))

        service = EmailService()

        while True:
            try:
                self.stdout.write("Checking for new emails...")
                emails = service.fetch_unseen_emails()

                if emails:
                    self.stdout.write(self.style.SUCCESS(f"Found {len(emails)} new emails!"))

                    for mail_data in emails:
                        # Создаем тикет в БД
                        ticket = Ticket.objects.create(
                            subject=mail_data['subject'],
                            sender_email=mail_data['sender_email'],
                            sender_name=mail_data['sender_name'],
                            raw_body=mail_data['body'],  # Сырое тело храним тут
                            received_at=time.timezone.now(),  # Лучше брать дату из письма, но пока так
                            status=Ticket.Status.NEW
                        )

                        # Сразу создаем первое входящее сообщение
                        Message.objects.create(
                            ticket=ticket,
                            direction=Message.Direction.INBOUND,
                            sender=mail_data['sender_email'],
                            recipient=service.email_user,
                            subject=mail_data['subject'],
                            body_text=mail_data['body'],
                            sent_at=timezone.now()
                        )
                        self.stdout.write(f"Created Ticket #{ticket.id}")

                        # TODO: Здесь можно вызвать AI-сервис (Celery task или просто функцию)
                        # process_ticket_with_ai(ticket.id)

                else:
                    self.stdout.write("No new emails.")

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error: {e}"))

            # Ждем 10 секунд перед следующей проверкой
            time.sleep(10)