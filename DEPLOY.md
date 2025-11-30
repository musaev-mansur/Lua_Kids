# Инструкция по деплою на VPS (Timeweb Cloud)

## Подготовка сервера

### 1. Подключение к серверу

```bash
ssh root@your-server-ip
```

### 2. Установка необходимого ПО

```bash
# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Устанавливаем Docker Compose
apt install docker-compose -y

# Устанавливаем Git
apt install git -y
```

### 3. Настройка домена

В панели управления Timeweb Cloud:
1. Добавьте A-запись для `haam.cloud` → IP вашего сервера
2. Добавьте A-запись для `www.haam.cloud` → IP вашего сервера

## Деплой проекта

### 1. Клонирование репозитория

```bash
cd /opt
git clone <your-repo-url> roblox_academy
cd roblox_academy
```

### 2. Создание файла окружения

```bash
# Создаем .env.production
cat > .env.production << EOF
SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
EOF
```

Или создайте файл вручную:
```bash
nano .env.production
```

Добавьте:
```
SECRET_KEY=ваш-секретный-ключ-здесь
```

### 3. Запуск деплоя

```bash
# Делаем скрипт исполняемым
chmod +x deploy.sh

# Запускаем деплой
./deploy.sh
```

Или вручную (сначала авторизуйтесь в Docker Hub):
```bash
docker login  # Создайте аккаунт на hub.docker.com если нет
docker-compose -f docker-compose.prod.yml up -d --build
```

### 4. Создание суперпользователя

```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### 5. Загрузка начальных данных (опционально)

```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py load_initial_data
```

## Настройка SSL (HTTPS)

### 1. Установка Certbot

```bash
apt install certbot -y
```

### 2. Получение SSL сертификата

```bash
# Останавливаем nginx временно
docker-compose -f docker-compose.prod.yml stop nginx

# Получаем сертификат
certbot certonly --standalone -d haam.cloud -d www.haam.cloud

# Копируем сертификаты в проект
mkdir -p nginx/ssl
cp -r /etc/letsencrypt/live/haam.cloud nginx/ssl/
```

### 3. Обновление конфигурации nginx

Раскомментируйте HTTPS секцию в `nginx/nginx.conf`:

```bash
nano nginx/nginx.conf
```

Раскомментируйте блок `server` с `listen 443 ssl` и закомментируйте редирект в HTTP блоке.

### 4. Перезапуск nginx

```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

### 5. Автоматическое обновление сертификата

Добавьте в crontab:
```bash
crontab -e
```

Добавьте строку:
```
0 3 * * * certbot renew --quiet && docker-compose -f /opt/roblox_academy/docker-compose.prod.full.yml restart nginx
```

## Полезные команды

### Просмотр логов
```bash
# Все сервисы
docker-compose -f docker-compose.prod.yml logs -f

# Только backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Только frontend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Только nginx
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Перезапуск сервисов
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Остановка сервисов
```bash
docker-compose -f docker-compose.prod.yml down
```

### Обновление проекта
```bash
cd /opt/roblox_academy
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

### Выполнение команд Django
```bash
# Миграции
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Сбор статики
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Создание суперпользователя
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## Структура портов

- **80** - HTTP (nginx)
- **443** - HTTPS (nginx)
- **8000** - Django backend (внутренний)
- **3000** - Next.js frontend (внутренний)

## Проверка работы

1. Откройте в браузере: `http://haam.cloud`
2. Проверьте API: `http://haam.cloud/api/`
3. Проверьте админку: `http://haam.cloud/admin/`

## Решение проблем

### Проблема: Сайт не открывается

1. Проверьте, что контейнеры запущены:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. Проверьте логи:
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

3. Проверьте DNS:
   ```bash
   nslookup haam.cloud
   ```

### Проблема: Ошибки миграций

```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Проблема: Статические файлы не загружаются

```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
docker-compose -f docker-compose.prod.yml restart nginx
```

## Безопасность

1. **Измените SECRET_KEY** в `.env.production`
2. **Настройте файрвол**:
   ```bash
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```
3. **Используйте HTTPS** в production
4. **Регулярно обновляйте** систему и Docker образы

## Мониторинг

Для мониторинга ресурсов:
```bash
# Использование ресурсов контейнерами
docker stats

# Использование диска
df -h

# Использование памяти
free -h
```

