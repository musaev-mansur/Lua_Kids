FROM python:3.11-slim

WORKDIR /app

# Установка зависимостей
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Установка Python пакетов
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование проекта
COPY . .

# Создание директорий
RUN mkdir -p /app/media /app/staticfiles

EXPOSE 8000

CMD ["gunicorn", "roblox_academy.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]

