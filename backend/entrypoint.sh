#!/bin/sh

# Ждем, пока поднимется Postgres (порт 5432)
echo "Waiting for postgres..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

# Накатываем миграции
echo "Apply database migrations..."
python manage.py migrate

# Собираем статику (CSS/JS для админки), чтобы Nginx мог её отдать
echo "Collect static files..."
python manage.py collectstatic --noinput

# Создаем суперюзера, если его нет (хак для хакатона, чтобы каждый раз не создавать)
# Можно закомментировать, если не нужно
echo "Creating superuser if not exists..."
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin')"

# Запускаем Gunicorn на 8000 порту
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3