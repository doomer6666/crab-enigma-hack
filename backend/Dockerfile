FROM python:3.11-slim

WORKDIR /app

# Чтобы видеть логи в консоли сразу
ENV PYTHONUNBUFFERED=1

# Копируем зависимости и устанавливаем
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код проекта
COPY . .

# Запуск одной командой:
# 1. Собираем статику
# 2. Накатываем миграции
# 3. Запускаем Gunicorn
CMD sh -c "python manage.py collectstatic --noinput && \
           python manage.py migrate && \
           gunicorn config.wsgi:application --bind 0.0.0.0:8000"