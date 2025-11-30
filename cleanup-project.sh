#!/bin/bash

# Скрипт очистки только проекта Roblox Academy
# Более безопасный вариант - удаляет только контейнеры и volumes проекта

set -e

echo "🧹 Очистка проекта Roblox Academy..."

# Переходим в директорию проекта (если скрипт запущен не из неё)
if [ -f docker-compose.prod.full.yml ] || [ -f docker-compose.prod.yml ]; then
    echo "✅ Найден проект в текущей директории"
else
    if [ -d /opt/roblox_academy ]; then
        cd /opt/roblox_academy
        echo "✅ Перешли в /opt/roblox_academy"
    else
        echo "❌ Проект не найден. Запустите скрипт из директории проекта или из /opt/roblox_academy"
        exit 1
    fi
fi

# Останавливаем и удаляем контейнеры проекта
echo "🛑 Останавливаем контейнеры проекта..."
if [ -f docker-compose.prod.full.yml ]; then
    docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
fi
if [ -f docker-compose.prod.yml ]; then
    docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
fi
if [ -f docker-compose.yml ]; then
    docker-compose down -v 2>/dev/null || true
fi

# Удаляем образы проекта
echo "🗑️  Удаляем образы проекта..."
docker rmi roblox_academy_backend roblox_academy_frontend roblox_academy_nginx 2>/dev/null || echo "Образы не найдены или уже удалены"

# Удаляем volumes проекта
echo "🗑️  Удаляем volumes проекта..."
docker volume rm roblox_academy_backend_media roblox_academy_backend_static 2>/dev/null || echo "Volumes не найдены или уже удалены"

# Удаляем сети проекта
echo "🗑️  Удаляем сети проекта..."
docker network rm roblox_academy_roblox_academy_network 2>/dev/null || echo "Сеть не найдена или уже удалена"

echo ""
echo "✅ Очистка проекта завершена!"
echo "🚀 Теперь можно запускать новый деплой:"
echo "   ./deploy.sh"

