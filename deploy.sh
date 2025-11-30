#!/bin/bash

# Скрипт деплоя Roblox Academy на VPS

set -e

echo "🚀 Начинаем деплой Roblox Academy..."

# Проверяем наличие .env файла
if [ ! -f .env.production ]; then
    echo "❌ Файл .env.production не найден!"
    echo "Создайте файл .env.production с переменными:"
    echo "SECRET_KEY=your-secret-key-here"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

# Останавливаем старые контейнеры
echo "🛑 Останавливаем старые контейнеры..."
docker-compose -f docker-compose.prod.full.yml down || true

# Собираем образы
echo "🔨 Собираем Docker образы..."
docker-compose -f docker-compose.prod.full.yml build --no-cache

# Запускаем контейнеры
echo "▶️  Запускаем контейнеры..."
docker-compose -f docker-compose.prod.full.yml up -d

# Ждем запуска
echo "⏳ Ждем запуска сервисов..."
sleep 10

# Проверяем статус
echo "📊 Статус контейнеров:"
docker-compose -f docker-compose.prod.full.yml ps

echo "✅ Деплой завершен!"
echo "🌐 Сайт доступен по адресу: http://haam.cloud"
echo "📝 Проверьте логи: docker-compose -f docker-compose.prod.full.yml logs -f"

