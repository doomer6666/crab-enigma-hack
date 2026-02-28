FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# установить uv
RUN pip install --no-cache-dir uv

# скопировать зависимости
COPY requirements.txt .

# установить зависимости через uv (быстрее pip)
RUN uv pip install --system -r requirements.txt

# скопировать код проекта
COPY . .

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Запускаем его
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 8000

CMD sh -c "python manage.py collectstatic --noinput && \
           python manage.py migrate && \
           gunicorn config.wsgi:application --bind 0.0.0.0:8000"
