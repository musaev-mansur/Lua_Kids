# Быстрый деплой на VPS

## Шаги деплоя

### 1. На сервере установите Docker и Docker Compose

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose git -y
```

### 2. Клонируйте проект

```bash
cd /opt
git clone <your-repo> roblox_academy
cd roblox_academy
```

### 3. Создайте .env.production

```bash
nano .env.production
```

Добавьте:
```
SECRET_KEY=сгенерируйте-новый-ключ-здесь
```

Сгенерировать ключ можно так:
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 4. Запустите деплой

```bash
chmod +x deploy.sh
./deploy.sh
```

Или вручную:
```bash
docker-compose -f docker-compose.prod.full.yml up -d --build
```

### 5. Настройте DNS

В панели Timeweb Cloud добавьте A-записи:
- `haam.cloud` → IP вашего сервера
- `www.haam.cloud` → IP вашего сервера

### 6. Создайте суперпользователя

```bash
docker-compose -f docker-compose.prod.full.yml exec backend python manage.py createsuperuser
```

### 7. Настройте SSL (опционально, но рекомендуется)

```bash
# Установите certbot
apt install certbot -y

# Остановите nginx
docker-compose -f docker-compose.prod.full.yml stop nginx

# Получите сертификат
certbot certonly --standalone -d haam.cloud -d www.haam.cloud

# Скопируйте сертификаты
mkdir -p nginx/ssl
cp -r /etc/letsencrypt/live/haam.cloud nginx/ssl/

# Раскомментируйте HTTPS в nginx/nginx.conf
nano nginx/nginx.conf

# Перезапустите nginx
docker-compose -f docker-compose.prod.full.yml restart nginx
```

## Готово! 🎉

Сайт доступен по адресу: **http://haam.cloud**

Для подробной инструкции см. `DEPLOY.md`

