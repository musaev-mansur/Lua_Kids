#!/bin/bash

# Скрипт полной очистки сервера перед новым деплоем
# ВНИМАНИЕ: Этот скрипт удалит ВСЕ Docker контейнеры, образы, volumes и сети!

set -e

echo "⚠️  ВНИМАНИЕ: Этот скрипт удалит:"
echo "   - Все Docker контейнеры"
echo "   - Все Docker образы"
echo "   - Все Docker volumes"
echo "   - Все Docker сети"
echo "   - Все неиспользуемые данные Docker"
echo ""
read -p "Вы уверены, что хотите продолжить? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Отменено пользователем"
    exit 1
fi

echo "🧹 Начинаем очистку сервера..."

# Останавливаем все контейнеры
echo "🛑 Останавливаем все контейнеры..."
docker stop $(docker ps -aq) 2>/dev/null || echo "Нет запущенных контейнеров"

# Удаляем все контейнеры
echo "🗑️  Удаляем все контейнеры..."
docker rm $(docker ps -aq) 2>/dev/null || echo "Нет контейнеров для удаления"

# Останавливаем docker-compose проекты
echo "🛑 Останавливаем docker-compose проекты..."
if [ -f docker-compose.prod.full.yml ]; then
    docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
fi
if [ -f docker-compose.prod.yml ]; then
    docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
fi
if [ -f docker-compose.yml ]; then
    docker-compose down -v 2>/dev/null || true
fi

# Удаляем все образы
echo "🗑️  Удаляем все Docker образы..."
docker rmi $(docker images -aq) 2>/dev/null || echo "Нет образов для удаления"

# Удаляем все volumes
echo "🗑️  Удаляем все Docker volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || echo "Нет volumes для удаления"

# Удаляем все сети (кроме стандартных)
echo "🗑️  Удаляем пользовательские Docker сети..."
docker network prune -f

# Полная очистка системы Docker
echo "🧹 Полная очистка Docker системы..."
docker system prune -a --volumes -f

# Очистка build cache
echo "🧹 Очистка build cache..."
docker builder prune -a -f

# Показываем освобожденное место
echo ""
echo "💾 Использование диска после очистки:"
df -h / | tail -1

# Показываем статус Docker
echo ""
echo "📊 Статус Docker:"
echo "Контейнеры: $(docker ps -aq | wc -l)"
echo "Образы: $(docker images -q | wc -l)"
echo "Volumes: $(docker volume ls -q | wc -l)"
echo "Сети: $(docker network ls -q | wc -l)"

echo ""
echo "✅ Очистка завершена!"
echo "🚀 Теперь можно запускать новый деплой:"
echo "   ./deploy.sh"
echo "   или"
echo "   docker-compose -f docker-compose.prod.yml up -d --build"

