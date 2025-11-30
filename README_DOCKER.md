# Docker Setup для Roblox Academy

Этот проект использует Docker для контейнеризации backend (Django) и frontend (Next.js) приложений.

## Требования

- Docker (версия 20.10 или выше)
- Docker Compose (версия 2.0 или выше)

## Быстрый старт

### 1. Запуск всех сервисов

```bash
docker-compose up --build
```

Эта команда:
- Соберет образы для backend и frontend
- Запустит оба контейнера
- Применит миграции базы данных
- Соберет статические файлы Django

### 2. Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin
- **Swagger API Docs**: http://localhost:8000/api/docs

### 3. Остановка контейнеров

```bash
docker-compose down
```

### 4. Остановка с удалением volumes

```bash
docker-compose down -v
```

## Команды для разработки

### Запуск в фоновом режиме

```bash
docker-compose up -d
```

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend
docker-compose logs -f frontend
```

### Выполнение команд в контейнере

```bash
# Backend (Django)
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py collectstatic

# Frontend (Next.js)
docker-compose exec frontend npm install
```

### Пересборка после изменений

```bash
# Пересборка всех сервисов
docker-compose up --build

# Пересборка только backend
docker-compose up --build backend

# Пересборка только frontend
docker-compose up --build frontend
```

## Структура проекта

```
ROBLOX_ACADEMY/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── ...
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── ...
├── docker-compose.yml
└── README_DOCKER.md
```

## Переменные окружения

### Backend

Переменные окружения для backend можно настроить в `docker-compose.yml`:

```yaml
environment:
  - DEBUG=True
  - SECRET_KEY=your-secret-key
  - ALLOWED_HOSTS=localhost,127.0.0.1,backend
  - CORS_ALLOWED_ORIGINS=http://localhost:3000,http://frontend:3000
```

### Frontend

Переменные окружения для frontend:

```yaml
environment:
  - NODE_ENV=production
  - NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Volumes

Docker Compose создает следующие volumes:

- `backend_media` - для медиа файлов Django
- `backend_static` - для статических файлов Django

## Сеть

Оба контейнера подключены к сети `roblox_academy_network`, что позволяет им общаться друг с другом по именам сервисов (`backend`, `frontend`).

## Troubleshooting

### Проблема: Порт уже занят

Если порты 3000 или 8000 уже заняты, измените их в `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Вместо 3000:3000
  - "8001:8000"  # Вместо 8000:8000
```

### Проблема: Миграции не применяются

Выполните миграции вручную:

```bash
docker-compose exec backend python manage.py migrate
```

### Проблема: Статические файлы не собираются

Соберите статические файлы вручную:

```bash
docker-compose exec backend python manage.py collectstatic --noinput
```

### Проблема: Frontend не подключается к Backend

Проверьте:
1. Оба контейнера запущены: `docker-compose ps`
2. Переменная `NEXT_PUBLIC_API_URL` правильно настроена
3. CORS настройки в Django разрешают запросы с frontend

### Очистка

Удалить все контейнеры, volumes и сети:

```bash
docker-compose down -v --remove-orphans
docker system prune -a
```

## Production

Для production окружения:

1. Измените `DEBUG=False` в `docker-compose.yml`
2. Установите безопасный `SECRET_KEY`
3. Настройте правильные `ALLOWED_HOSTS`
4. Используйте PostgreSQL вместо SQLite
5. Настройте reverse proxy (nginx) для статических файлов
6. Используйте SSL/TLS сертификаты

