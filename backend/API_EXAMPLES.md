# Примеры использования API

## Базовый URL
```
http://localhost:8000/api/
```

## 1. Курсы (Courses)

### Получить все курсы
```bash
GET /api/courses/
```

Ответ:
```json
[
  {
    "id": "roblox-lua-101",
    "title": "Master Roblox Studio & Lua",
    "description": "Learn how to build your own games...",
    "thumbnail_url": "/placeholder.svg",
    "lessons_count": 3
  }
]
```

### Получить курс с уроками
```bash
GET /api/courses/roblox-lua-101/
```

Ответ:
```json
{
  "id": "roblox-lua-101",
  "title": "Master Roblox Studio & Lua",
  "description": "Learn how to build your own games...",
  "thumbnail_url": "/placeholder.svg",
  "lessons": [
    {
      "id": "lesson-1",
      "title": "Introduction to Roblox Studio",
      "description": "Learn the interface...",
      "order": 1,
      "video_url": "https://youtube.com/...",
      "content": "# Welcome...",
      "duration": 10,
      "xp_reward": 50,
      "is_locked": false,
      "challenge": {
        "instructions": "Print Hello Roblox",
        "initial_code": "print(\"Hello World\")",
        "expected_output": "Hello Roblox",
        "hints": []
      }
    }
  ]
}
```

### Создать курс
```bash
POST /api/courses/
Content-Type: application/json

{
  "id": "roblox-lua-101",
  "title": "Master Roblox Studio & Lua",
  "description": "Learn how to build your own games in Roblox using Lua scripting.",
  "thumbnail_url": "/placeholder.svg"
}
```

### Обновить курс
```bash
PUT /api/courses/roblox-lua-101/
Content-Type: application/json

{
  "id": "roblox-lua-101",
  "title": "Updated Title",
  "description": "Updated description",
  "thumbnail_url": "/new-image.svg"
}
```

## 2. Уроки (Lessons)

### Получить все уроки
```bash
GET /api/lessons/
```

### Получить уроки конкретного курса
```bash
GET /api/lessons/?course=roblox-lua-101
```

### Получить конкретный урок
```bash
GET /api/lessons/lesson-1/
```

### Создать урок с заданием
```bash
POST /api/lessons/
Content-Type: application/json

{
  "id": "lesson-1",
  "course": "roblox-lua-101",
  "title": "Introduction to Roblox Studio",
  "description": "Learn the interface and how to move around the 3D world.",
  "order": 1,
  "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
  "content": "# Welcome to Roblox Studio!\n\nIn this lesson...",
  "duration": 10,
  "xp_reward": 50,
  "is_locked": false,
  "challenge": {
    "instructions": "Print \"Hello Roblox\" to the console.",
    "initial_code": "print(\"Hello World\")",
    "expected_output": "Hello Roblox",
    "hints": []
  }
}
```

### Обновить урок
```bash
PUT /api/lessons/lesson-1/
Content-Type: application/json

{
  "id": "lesson-1",
  "course": "roblox-lua-101",
  "title": "Updated Title",
  "description": "Updated description",
  "order": 1,
  "content": "# Updated content",
  "duration": 15,
  "xp_reward": 100,
  "is_locked": false,
  "challenge": {
    "instructions": "Updated instructions",
    "initial_code": "print(\"Updated\")",
    "expected_output": "Updated",
    "hints": ["Hint 1", "Hint 2"]
  }
}
```

### Частично обновить урок
```bash
PATCH /api/lessons/lesson-1/
Content-Type: application/json

{
  "is_locked": true
}
```

### Удалить урок
```bash
DELETE /api/lessons/lesson-1/
```

## 3. Пользователи (Users)

### Получить всех пользователей
```bash
GET /api/users/
```

### Получить пользователя
```bash
GET /api/users/1/
```

### Создать пользователя
```bash
POST /api/users/
Content-Type: application/json

{
  "username": "alex",
  "email": "alex@example.com",
  "first_name": "Alex",
  "role": "student",
  "level": 3,
  "xp": 450,
  "avatar_url": "/placeholder.svg"
}
```

### Получить прогресс пользователя
```bash
GET /api/users/1/progress/
```

## 4. Прогресс (UserProgress)

### Получить весь прогресс
```bash
GET /api/progress/
```

### Получить прогресс пользователя
```bash
GET /api/progress/?user=1
```

### Получить прогресс по курсу
```bash
GET /api/progress/?course=roblox-lua-101
```

### Получить текущий прогресс
```bash
GET /api/progress/current/?user_id=1&course_id=roblox-lua-101
```

Ответ:
```json
{
  "id": 1,
  "user": 1,
  "course": "roblox-lua-101",
  "course_title": "Master Roblox Studio & Lua",
  "completed_lesson_ids": ["lesson-1"],
  "current_lesson_id": "lesson-1",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### Создать запись прогресса
```bash
POST /api/progress/
Content-Type: application/json

{
  "user": 1,
  "course": "roblox-lua-101",
  "completed_lesson_ids": ["lesson-1"],
  "current_lesson_id": "lesson-1"
}
```

### Отметить урок как завершенный
```bash
POST /api/progress/complete_lesson/
Content-Type: application/json

{
  "user_id": 1,
  "course_id": "roblox-lua-101",
  "lesson_id": "lesson-1"
}
```

Этот endpoint автоматически:
- Добавляет `lesson_id` в `completed_lesson_ids` (если его там еще нет)
- Устанавливает `current_lesson_id` на завершенный урок
- Создает запись прогресса, если её еще нет

### Обновить прогресс
```bash
PUT /api/progress/1/
Content-Type: application/json

{
  "user": 1,
  "course": "roblox-lua-101",
  "completed_lesson_ids": ["lesson-1", "lesson-2"],
  "current_lesson_id": "lesson-2"
}
```

## Примеры с curl

### Получить все курсы
```bash
curl http://localhost:8000/api/courses/
```

### Создать урок
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

## Примеры с JavaScript (Fetch API)

### Получить все курсы
```javascript
fetch('http://localhost:8000/api/courses/')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Создать урок
```javascript
fetch('http://localhost:8000/api/lessons/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: 'lesson-1',
    course: 'roblox-lua-101',
    title: 'Introduction to Roblox Studio',
    description: 'Learn the interface',
    order: 1,
    content: '# Welcome!',
    duration: 10,
    xp_reward: 50,
    is_locked: false,
    challenge: {
      instructions: 'Print Hello Roblox',
      initial_code: 'print("Hello World")',
      expected_output: 'Hello Roblox'
    }
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

### Отметить урок как завершенный
```javascript
fetch('http://localhost:8000/api/progress/complete_lesson/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_id: 1,
    course_id: 'roblox-lua-101',
    lesson_id: 'lesson-1'
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

