import telebot
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.users.models import TelegramSubscriber


class Command(BaseCommand):
    help = 'Запускает Telegram бота для подписок (прослушивание /start, /subscribe, /unsubscribe)'

    def handle(self, *args, **kwargs):
        token = settings.TELEGRAM_BOT_TOKEN
        if not token:
            self.stdout.write(self.style.ERROR("❌ Токен Telegram не найден в .env!"))
            return

        bot = telebot.TeleBot(token)
        self.stdout.write(self.style.SUCCESS("🤖 Бот запущен! Жду сообщений..."))

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

        @bot.message_handler(commands=['start', 'subscribe'])
        def handle_subscribe(message):
            chat_id = str(message.chat.id)
            username = message.from_user.username or "NoUsername"

            # Сохраняем в базу (или обновляем)
            subscriber, created = TelegramSubscriber.objects.get_or_create(
                chat_id=chat_id,
                defaults={'username': username}
            )

            if created:
                bot.reply_to(message, "С возвращением, сэр(мэм), чаю?")
                print(f"➕ Новый подписчик: {username} ({chat_id})")
            else:
                bot.reply_to(message, "Держу в курсе событий,сэр(мэм).")
                print(f"🔄 Пользователь {username} ({chat_id}) уже есть в базе.")

        @bot.message_handler(commands=['unsubscribe'])
        def handle_unsubscribe(message):
            chat_id = str(message.chat.id)
            username = message.from_user.username or "NoUsername"

            try:
                # Удаляем из базы
                subscriber = TelegramSubscriber.objects.get(chat_id=chat_id)
                subscriber.delete()
                bot.reply_to(message, "Спокойной ночи, сэр(мэм).")
                print(f"➖ Пользователь {username} ({chat_id}) отписался.")
            except TelegramSubscriber.DoesNotExist:
                bot.reply_to(message, "Протоколы отключены, сэр(мэм).")
                print(f"⚠️ Пользователь {username} ({chat_id}) попытался отписаться, но его нет в базе.")

        @bot.message_handler(commands=['help'])
        def handle_help(message):
            text = (
                "<b>Справка по Jarvis Alarm Bot</b>\n\n"
                "Этот бот отправляет уведомления техподдержке, когда поступает <b>негативное</b> обращение от клиента.\n\n"
                "<b>Команды:</b>\n"
                "/subscribe — ✅ Подписаться на уведомления\n"
                "/unsubscribe — ❌ Отписаться (не получать уведомления)\n"
                "/help — ❓ Эта справка"
            )
            bot.send_message(message.chat.id, text, parse_mode='HTML')
        # Запускаем бесконечный цикл опроса
        try:
            bot.infinity_polling()
        except Exception as e:
            print(f"Bot error: {e}")
