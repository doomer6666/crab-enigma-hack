#!/bin/sh

# Ждем базу
echo "Waiting for postgres..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

# Миграции и статика
python manage.py migrate
python manage.py collectstatic --noinput

# Запускаем фоновую задачу опроса почты (в фоновом режиме &)
# Логи пишем в stdout, чтобы Docker их видел
echo "Starting email poller..."
python manage.py poll_mails &

# Запускаем основной веб-сервер (Gunicorn)
# exec заменяет текущий процесс шелла на процесс гуникорна
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3