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

# Проверяем авторизацию в Docker Hub (решает проблему 429)
if ! docker info 2>/dev/null | grep -q "Username"; then
    echo "⚠️  Вы не авторизованы в Docker Hub"
    echo "Авторизация увеличит лимит с 100 до 200 запросов!"
    echo "Создайте аккаунт на https://hub.docker.com/ (бесплатно)"
    read -p "Авторизоваться сейчас? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker login
    else
        echo "Продолжаем без авторизации (может быть rate limit)..."
    fi
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

# Останавливаем старые контейнеры
echo "🛑 Останавливаем старые контейнеры..."
docker-compose -f docker-compose.prod.yml down || true

# Предзагружаем образы (если их нет)
echo "📥 Проверяем наличие образов..."
if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^python:3.11-slim$"; then
    echo "Загружаем python:3.11-slim..."
    docker pull python:3.11-slim || echo "⚠️  Ошибка загрузки (может быть rate limit)"
else
    echo "✅ python:3.11-slim уже загружен"
fi

if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^node:20-alpine$"; then
    echo "Загружаем node:20-alpine..."
    docker pull node:20-alpine || echo "⚠️  Ошибка загрузки (может быть rate limit)"
    if [ $? -ne 0 ]; then
        echo "❌ Не удалось загрузить node:20-alpine из-за rate limit"
        echo "Подождите 1-2 часа или авторизуйтесь: docker login"
        exit 1
    fi
else
    echo "✅ node:20-alpine уже загружен"
fi

# Собираем образы
echo "🔨 Собираем Docker образы..."
docker-compose -f docker-compose.prod.yml build

# Запускаем контейнеры
echo "▶️  Запускаем контейнеры..."
docker-compose -f docker-compose.prod.yml up -d

# Ждем запуска
echo "⏳ Ждем запуска сервисов..."
sleep 10

# Проверяем статус
echo "📊 Статус контейнеров:"
docker-compose -f docker-compose.prod.yml ps

echo "✅ Деплой завершен!"
echo "🌐 Сайт доступен по адресу: http://haam.cloud"
echo "📝 Проверьте логи: docker-compose -f docker-compose.prod.yml logs -f"

