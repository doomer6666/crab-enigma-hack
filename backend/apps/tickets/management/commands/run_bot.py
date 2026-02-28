from django.core.management.base import BaseCommand
from django.conf import settings
from apps.users.models import TelegramSubscriber
import telebot


class Command(BaseCommand):
    help = 'Запускает Telegram бота для подписок'

    def handle(self, *args, **kwargs):
        if not settings.TELEGRAM_BOT_TOKEN:
            self.stdout.write(self.style.ERROR("Token not found"))
            return

        bot = telebot.TeleBot(settings.TELEGRAM_BOT_TOKEN)
        self.stdout.write(self.style.SUCCESS("🤖 Telegram Bot Started! Waiting for /start..."))

        @bot.message_handler(commands=['start'])
        def handle_start(message):
            chat_id = str(message.chat.id)
            username = message.from_user.username

            obj, created = TelegramSubscriber.objects.get_or_create(
                chat_id=chat_id,
                defaults={'username': username}
            )

            if created:
                bot.reply_to(message, "✅ Вы успешно подписались на уведомления о негативных письмах!")
                print(f"New subscriber: {username} ({chat_id})")
            else:
                bot.reply_to(message, "Вы уже подписаны.")

        # Запуск бесконечного опроса (polling)
        bot.infinity_polling()