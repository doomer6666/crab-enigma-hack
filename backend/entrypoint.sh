#!/bin/sh

# Ждем базу
echo "PostgreSQL started"

# Миграции и статика
python manage.py migrate
python manage.py collectstatic --noinput

# Запускаем фоновую задачу опроса почты (в фоновом режиме &)
# Логи пишем в stdout, чтобы Docker их видел
echo "Starting email poller..."
python manage.py poll_mails &

echo "Starting Telegram Bot..."
python manage.py run_bot &

# Запускаем основной веб-сервер (Gunicorn)
# exec заменяет текущий процесс шелла на процесс гуникорна
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 5