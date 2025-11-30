# Полная очистка сервера

## ⚠️ ВНИМАНИЕ

Этот процесс удалит **ВСЕ** данные Docker на сервере:
- Все контейнеры
- Все образы
- Все volumes (включая базы данных!)
- Все сети
- Все build cache

**Это необратимо!** Убедитесь, что у вас есть резервные копии важных данных.

## Быстрая очистка

### Вариант 1: Использовать скрипт

```bash
chmod +x cleanup-server.sh
./cleanup-server.sh
```

Скрипт попросит подтверждение перед удалением.

### Вариант 2: Ручная очистка

```bash
# Остановить все контейнеры
docker stop $(docker ps -aq)

# Удалить все контейнеры
docker rm $(docker ps -aq)

# Удалить все образы
docker rmi $(docker images -aq)

# Удалить все volumes
docker volume rm $(docker volume ls -q)

# Полная очистка
docker system prune -a --volumes -f
docker builder prune -a -f
```

## Очистка конкретного проекта

Если нужно очистить только проект Roblox Academy:

```bash
cd /opt/roblox_academy

# Остановить и удалить контейнеры проекта
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml down -v
docker-compose down -v

# Удалить образы проекта
docker rmi roblox_academy_backend roblox_academy_frontend roblox_academy_nginx 2>/dev/null || true

# Удалить volumes проекта
docker volume rm roblox_academy_backend_media roblox_academy_backend_static 2>/dev/null || true
```

## Проверка освобожденного места

```bash
# До очистки
df -h /

# После очистки
df -h /
docker system df
```

## После очистки

1. Проверьте, что все удалено:
   ```bash
   docker ps -a
   docker images
   docker volume ls
   ```

2. Запустите новый деплой:
   ```bash
   cd /opt/roblox_academy
   ./deploy.sh
   ```

## Очистка системных файлов (опционально)

Если нужно освободить еще больше места:

```bash
# Очистка apt кэша
apt clean
apt autoremove -y

# Очистка логов
journalctl --vacuum-time=3d

# Очистка временных файлов
rm -rf /tmp/*
rm -rf /var/tmp/*
```

## Восстановление после очистки

После очистки нужно:

1. **Пересоздать .env.production** (если был удален):
   ```bash
   nano .env.production
   # Добавьте SECRET_KEY=...
   ```

2. **Запустить деплой заново**:
   ```bash
   ./deploy.sh
   ```

3. **Создать суперпользователя**:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
   ```

4. **Загрузить начальные данные** (если нужно):
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python manage.py load_initial_data
   ```

