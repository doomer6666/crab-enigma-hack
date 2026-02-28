import telebot
from django.conf import settings
from apps.users.models import TelegramSubscriber

# Инициализируем бота (если токен есть)
bot = None
if settings.TELEGRAM_BOT_TOKEN:
    bot = telebot.TeleBot(settings.TELEGRAM_BOT_TOKEN, threaded=False)


def send_telegram_alert(ticket):
    """
    Отправляет уведомление всем подписчикам о негативном тикете
    """
    if not bot:
        print("⚠️ Telegram token not found. Skipping notification.")
        return

    # Формируем текст сообщения
    text = (
        f"🔥 <b>НЕГАТИВНОЕ ОБРАЩЕНИЕ!</b>\n\n"
        f"🆔 Тикет: #{ticket.id}\n"
        f"👤 От: {ticket.sender_name} ({ticket.sender_email})\n"
        f"🏢 Объект: {ticket.object_name or 'Не указан'}\n"
        f"📝 Тема: {ticket.subject}\n"
    )

    # Получаем всех подписчиков
    subscribers = TelegramSubscriber.objects.all()

    if not subscribers:
        print("No telegram subscribers found.")
        return

    print(f"📤 Sending Telegram alert to {len(subscribers)} users...")

    for sub in subscribers:
        try:
            bot.send_message(sub.chat_id, text, parse_mode='HTML')
        except Exception as e:
            print(f"Failed to send telegram to {sub.chat_id}: {e}")