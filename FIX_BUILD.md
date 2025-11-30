# Исправление ошибки сборки frontend

## Проблема
```
Module not found: Can't resolve '@/lib/hooks'
Module not found: Can't resolve '@/lib/api/authSlice'
Module not found: Can't resolve '@/lib/api/apiSlice'
```

## Решение на сервере

Выполните команды:

```bash
# 1. Остановите контейнеры
docker-compose -f docker-compose.prod.yml down

# 2. Удалите старые образы frontend (чтобы пересобрать без кэша)
docker rmi roblox_academy_frontend || true

# 3. Пересоберите frontend БЕЗ кэша
docker-compose -f docker-compose.prod.yml build --no-cache frontend

# 4. Запустите все
docker-compose -f docker-compose.prod.yml up -d
```

Или одной командой:
```bash
docker-compose -f docker-compose.prod.yml down && \
docker rmi roblox_academy_frontend 2>/dev/null || true && \
docker-compose -f docker-compose.prod.yml build --no-cache frontend && \
docker-compose -f docker-compose.prod.yml up -d
```

