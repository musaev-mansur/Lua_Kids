# Roblox Academy Backend API

Django REST Framework API для образовательной платформы Roblox Academy.

## Установка

1. Создайте виртуальное окружение:
```bash
python -m venv venv
```

2. Активируйте виртуальное окружение:
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

3. Установите зависимости:
```bash
pip install -r requirements.txt
```

4. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

5. Выполните миграции:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Создайте суперпользователя:
```bash
python manage.py createsuperuser
```

7. Загрузите начальные данные (опционально):
```bash
python manage.py loaddata initial_data.json
```

8. Запустите сервер:
```bash
python manage.py runserver
```

API будет доступен по адресу: `http://localhost:8000/api/`

## API Endpoints

### Курсы (Courses)

- `GET /api/courses/` - Список всех курсов
- `GET /api/courses/{id}/` - Детали курса с уроками
- `POST /api/courses/` - Создать курс
- `PUT /api/courses/{id}/` - Обновить курс
- `DELETE /api/courses/{id}/` - Удалить курс
- `GET /api/courses/{id}/lessons/` - Получить все уроки курса

### Уроки (Lessons)

- `GET /api/lessons/` - Список всех уроков
- `GET /api/lessons/?course={course_id}` - Уроки конкретного курса
- `GET /api/lessons/{id}/` - Детали урока
- `POST /api/lessons/` - Создать урок
- `PUT /api/lessons/{id}/` - Обновить урок
- `PATCH /api/lessons/{id}/` - Частично обновить урок
- `DELETE /api/lessons/{id}/` - Удалить урок

### Пользователи (Users)

- `GET /api/users/` - Список пользователей
- `GET /api/users/{id}/` - Детали пользователя
- `POST /api/users/` - Создать пользователя
- `PUT /api/users/{id}/` - Обновить пользователя
- `GET /api/users/{id}/progress/` - Прогресс пользователя

### Прогресс (UserProgress)

- `GET /api/progress/` - Список всего прогресса
- `GET /api/progress/?user={user_id}` - Прогресс пользователя
- `GET /api/progress/?course={course_id}` - Прогресс по курсу
- `GET /api/progress/current/?user_id={id}&course_id={id}` - Текущий прогресс
- `POST /api/progress/` - Создать запись прогресса
- `POST /api/progress/complete_lesson/` - Отметить урок как завершенный
- `PUT /api/progress/{id}/` - Обновить прогресс

## Примеры запросов

### Создать курс
```bash
curl -X POST http://localhost:8000/api/courses/ \
  -H "Content-Type: application/json" \
  -d '{
    "id": "roblox-lua-101",
    "title": "Master Roblox Studio & Lua",
    "description": "Learn how to build your own games in Roblox using Lua scripting."
  }'
```

### Создать урок с заданием
```bash
curl -X POST http://localhost:8000/api/lessons/ \
  -H "Content-Type: application/json" \
  -d '{
    "id": "lesson-1",
    "course": "roblox-lua-101",
    "title": "Introduction to Roblox Studio",
    "description": "Learn the interface",
    "order": 1,
    "content": "# Welcome!",
    "duration": 10,
    "xp_reward": 50,
    "is_locked": false,
    "challenge": {
      "instructions": "Print Hello Roblox",
      "initial_code": "print(\"Hello World\")",
      "expected_output": "Hello Roblox"
    }
  }'
```

### Отметить урок как завершенный
```bash
curl -X POST http://localhost:8000/api/progress/complete_lesson/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "course_id": "roblox-lua-101",
    "lesson_id": "lesson-1"
  }'
```

## Админ-панель

Доступна по адресу: `http://localhost:8000/admin/`

Используйте учетные данные суперпользователя для входа.

## Настройка CORS

CORS настроен для работы с frontend на `localhost:3000`. Для изменения настроек отредактируйте `roblox_academy/settings.py`.

