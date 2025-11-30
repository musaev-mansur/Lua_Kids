# Настройка Lua редактора

## Установка зависимостей

Перед использованием Lua редактора необходимо установить следующие пакеты:

```bash
cd frontend
npm install @monaco-editor/react fengari
```

## Компоненты

### LuaEditor (`components/lesson/lua-editor.tsx`)
- Monaco Editor с подсветкой синтаксиса Lua
- Интеграция с Fengari для выполнения кода
- Песочница для безопасности

### LuaExecutor (`lib/lua-executor.ts`)
- Класс для безопасного выполнения Lua кода
- Ограничения доступа к опасным функциям
- Таймаут выполнения (5 секунд)

## Backend API

### POST `/api/check_code/`

Проверяет выполнение Lua кода и сравнивает результат с ожидаемым выводом.

**Request:**
```json
{
  "lesson_id": "string",
  "code": "string",
  "output": ["string"],
  "error": "string | null"
}
```

**Response:**
```json
{
  "passed": boolean,
  "message": "string",
  "expected": "string",
  "actual": ["string"]
}
```

## Использование

1. Установите зависимости: `npm install`
2. Перезапустите dev сервер: `npm run dev`
3. Откройте урок с challenge
4. Напишите Lua код в редакторе
5. Нажмите "Run Script" для выполнения
6. Результаты отправляются на backend для проверки

## Безопасность

LuaExecutor ограничивает доступ к:
- `dofile`, `loadfile` - загрузка файлов
- `require`, `package` - модули
- `io` - файловая система
- `os` - системные команды
- `debug` - отладка
- `getmetatable`, `setmetatable` - метатаблицы

## Примеры

### Простой print
```lua
print("Hello, World!")
```

### Переменные
```lua
local score = 10
print(score)
```

### Функции
```lua
function add(a, b)
    return a + b
end
print(add(3, 5))
```

