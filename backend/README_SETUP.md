# Инструкция по настройке Backend

## Быстрый старт

1. **Активируйте виртуальное окружение:**
```bash
cd backend
.\env\Scripts\Activate.ps1  # Windows PowerShell
# или
source env/bin/activate  # Linux/Mac
```

2. **Примените миграции:**
```bash
python manage.py migrate
```

3. **Загрузите начальные данные:**
```bash
python manage.py load_initial_data
```

Эта команда создаст:
- Пользователя `alex` (ID будет показан в выводе команды)
- Курс `roblox-lua-101`
- 3 урока с заданиями

4. **Создайте суперпользователя (опционально):**
```bash
python manage.py createsuperuser
```

5. **Запустите сервер:**
```bash
python manage.py runserver
```

## Важно для Frontend

После выполнения `load_initial_data`, команда покажет ID созданного пользователя. 
Обновите `USER_ID` в следующих файлах frontend:

- `frontend/app/page.tsx` - строка с `const USER_ID = "1"`
- `frontend/app/lesson/[lessonId]/page.tsx` - строка с `const USER_ID = "1"`
- `frontend/components/student/student-nav.tsx` - строка с `const USER_ID = "1"`

Замените `"1"` на реальный ID пользователя, который будет показан в выводе команды.

## Проверка данных

После загрузки данных проверьте API:

```bash
# Получить все курсы
curl http://localhost:8000/api/courses/

# Получить конкретный курс
curl http://localhost:8000/api/courses/roblox-lua-101/

# Получить пользователя
curl http://localhost:8000/api/users/1/
```

## Админ-панель

Доступна по адресу: `http://localhost:8000/admin/`

Используйте учетные данные суперпользователя для входа.

