# Система аутентификации

## Реализованные функции

### Backend (Django REST Framework)
- ✅ `POST /api/auth/login/` - Вход пользователя
- ✅ `POST /api/auth/logout/` - Выход пользователя  
- ✅ `GET /api/auth/me/` - Получить текущего пользователя
- ✅ Token Authentication - аутентификация через токены

### Frontend (Next.js + RTK Query)
- ✅ Страница логина (`/login`)
- ✅ Redux slice для управления аутентификацией
- ✅ Автоматическое сохранение токена в localStorage
- ✅ Автоматическая отправка токена в заголовках запросов
- ✅ Защита маршрутов (редирект на /login если не авторизован)
- ✅ Кнопка выхода в навигации

## Использование

### Вход в систему

1. Откройте `/login`
2. Введите учетные данные:
   - **Username**: `alex` (или другой созданный пользователь)
   - **Password**: `password123` (пароль из команды load_initial_data)

### Автоматическая аутентификация

После входа:
- Токен сохраняется в `localStorage`
- Данные пользователя сохраняются в Redux store
- Все API запросы автоматически включают токен в заголовках
- При перезагрузке страницы пользователь остается авторизованным

### Выход из системы

Нажмите кнопку "Log out" в меню пользователя в навигации.

## Технические детали

### Хранение данных
- Токен: `localStorage.getItem('token')`
- Пользователь: `localStorage.getItem('user')`
- Redux state: `state.auth`

### API Endpoints

```typescript
// Вход
POST /api/auth/login/
Body: { username: string, password: string }
Response: { token: string, user: User }

// Выход
POST /api/auth/logout/
Headers: Authorization: Token <token>

// Текущий пользователь
GET /api/auth/me/
Headers: Authorization: Token <token>
Response: User
```

### Использование в компонентах

```typescript
import { useAppSelector } from '@/lib/hooks'

const { user, isAuthenticated, token } = useAppSelector((state) => state.auth)
```

### Защита маршрутов

Маршруты автоматически проверяют аутентификацию и перенаправляют на `/login` если пользователь не авторизован.

