# Lua Test Codes - Ручное тестирование

Этот документ содержит все тестовые коды Lua, которые можно использовать для ручного тестирования Lua Executor в терминале или в редакторе кода на странице урока.

## Базовые тесты

### 1. Базовые операции и переменные

```lua
-- Базовые переменные и операции
local a = 10
local b = 20
local sum = a + b
local product = a * b
print("Сумма:", sum)
print("Произведение:", product)
print("Деление:", b / a)
print("Остаток:", b % a)
print("Степень:", a ^ 2)
```

### 2. Строки и строковые операции

```lua
-- Работа со строками
local str1 = "Hello"
local str2 = "World"
local concat = str1 .. " " .. str2
print("Конкатенация:", concat)
print("Длина строки:", #str1)
print("Повтор:", string.rep(str1, 3))
print("Верхний регистр:", string.upper(str1))
print("Нижний регистр:", string.lower("WORLD"))
print("Подстрока:", string.sub(str1, 1, 3))
print("Найти:", string.find(str1, "ell"))
```

### 3. Таблицы (массивы и объекты)

```lua
-- Таблицы как массивы
local arr = {10, 20, 30, 40, 50}
print("Массив:", table.concat(arr, ", "))
print("Длина массива:", #arr)
print("Первый элемент:", arr[1])
print("Последний элемент:", arr[#arr])

-- Таблицы как объекты
local person = {
  name = "Alex",
  age = 25,
  role = "student"
}
print("Имя:", person.name)
print("Возраст:", person.age)
print("Роль:", person.role)

-- Вложенные таблицы
local data = {
  user = {name = "John", level = 5},
  course = {title = "Lua Basics", xp = 100}
}
print("Пользователь:", data.user.name, "Уровень:", data.user.level)
print("Курс:", data.course.title, "XP:", data.course.xp)
```

### 4. Функции

```lua
-- Простые функции
function greet(name)
  return "Привет, " .. name .. "!"
end

local greeting = greet("Roblox")
print(greeting)

-- Функции с несколькими параметрами
function calculate(a, b, operation)
  if operation == "add" then
    return a + b
  elseif operation == "multiply" then
    return a * b
  else
    return a - b
  end
end

print("Сложение:", calculate(10, 5, "add"))
print("Умножение:", calculate(10, 5, "multiply"))
print("Вычитание:", calculate(10, 5, "subtract"))

-- Анонимные функции
local square = function(x) return x * x end
print("Квадрат 5:", square(5))

-- Функции высшего порядка
function apply(func, value)
  return func(value)
end
print("Применение функции:", apply(square, 4))
```

### 5. Ветвления (if/else)

```lua
-- Простые условия
local score = 85

if score >= 90 then
  print("Отлично!")
elseif score >= 70 then
  print("Хорошо!")
elseif score >= 50 then
  print("Удовлетворительно")
else
  print("Нужно подтянуть")
end

-- Логические операции
local a = true
local b = false
print("AND:", a and b)
print("OR:", a or b)
print("NOT:", not a)

-- Тернарный оператор (через and/or)
local x = 10
local result = (x > 5) and "Больше 5" or "Меньше или равно 5"
print("Результат:", result)
```

### 6. Циклы for

```lua
-- Цикл for с числами
print("Цикл for (1-5):")
for i = 1, 5 do
  print("  Итерация:", i)
end

-- Цикл for с шагом
print("Цикл for с шагом 2:")
for i = 0, 10, 2 do
  print("  Четное:", i)
end

-- Цикл for по таблице (ipairs)
local fruits = {"яблоко", "банан", "апельсин"}
print("Фрукты:")
for i, fruit in ipairs(fruits) do
  print("  " .. i .. ":", fruit)
end

-- Цикл for по таблице (pairs)
local student = {name = "Alex", age = 20, level = 3}
print("Свойства студента:")
for key, value in pairs(student) do
  print("  " .. key .. ":", value)
end
```

### 7. Циклы while и repeat

```lua
-- Цикл while
local count = 1
print("Цикл while:")
while count <= 5 do
  print("  Счетчик:", count)
  count = count + 1
end

-- Цикл repeat-until
local num = 1
print("Цикл repeat-until:")
repeat
  print("  Число:", num)
  num = num + 1
until num > 5

-- Условный выход из цикла
print("Условный выход:")
for i = 1, 10 do
  if i == 7 then
    break
  end
  print("  i:", i)
end
```

### 8. Математические функции

```lua
-- Математические функции
print("Абсолютное значение:", math.abs(-10))
print("Округление вверх:", math.ceil(4.3))
print("Округление вниз:", math.floor(4.7))
print("Максимум:", math.max(10, 20, 5))
print("Минимум:", math.min(10, 20, 5))
print("Случайное число:", math.random(1, 100))
print("Квадратный корень:", math.sqrt(16))
print("Синус:", math.sin(math.pi / 2))
print("Косинус:", math.cos(0))
print("Пи:", math.pi)
```

### 9. Работа с таблицами (table.*)

```lua
-- Функции для работы с таблицами
local t = {3, 1, 4, 1, 5}

-- Вставка
table.insert(t, 9)
print("После вставки:", table.concat(t, ", "))

-- Удаление
table.remove(t, 1)
print("После удаления:", table.concat(t, ", "))

-- Сортировка
table.sort(t)
print("После сортировки:", table.concat(t, ", "))

-- Поиск
local found = false
for i, v in ipairs(t) do
  if v == 5 then
    found = true
    print("Найдено 5 на позиции:", i)
    break
  end
end
```

### 10. Комплексный пример (все вместе)

```lua
-- Комплексный пример: система прогресса
local function calculateXP(completed, difficulty)
  local baseXP = 50
  local multiplier = difficulty or 1
  return completed and (baseXP * multiplier) or 0
end

local lessons = {
  {title = "Введение", completed = true, difficulty = 1},
  {title = "Переменные", completed = true, difficulty = 1.5},
  {title = "Функции", completed = false, difficulty = 2},
  {title = "Циклы", completed = true, difficulty = 2.5}
}

local totalXP = 0
print("Прогресс по урокам:")
for i, lesson in ipairs(lessons) do
  local xp = calculateXP(lesson.completed, lesson.difficulty)
  totalXP = totalXP + xp
  local status = lesson.completed and "✓" or "✗"
  print(string.format("  %s %s: %d XP", status, lesson.title, xp))
end

print("Общий XP:", totalXP)
print("Уровень:", math.floor(totalXP / 100) + 1)
```

### 11. Рекурсия

```lua
-- Рекурсивная функция
function factorial(n)
  if n <= 1 then
    return 1
  else
    return n * factorial(n - 1)
  end
end

print("Факториал 5:", factorial(5))
print("Факториал 7:", factorial(7))

-- Рекурсия с таблицами
function sumArray(arr, index)
  index = index or 1
  if index > #arr then
    return 0
  end
  return arr[index] + sumArray(arr, index + 1)
end

local numbers = {1, 2, 3, 4, 5}
print("Сумма массива (рекурсия):", sumArray(numbers))
```

### 12. Замыкания

```lua
-- Замыкания
function createCounter()
  local count = 0
  return function()
    count = count + 1
    return count
  end
end

local counter1 = createCounter()
local counter2 = createCounter()

print("Счетчик 1:", counter1())
print("Счетчик 1:", counter1())
print("Счетчик 2:", counter2())
print("Счетчик 1:", counter1())
```

---

## Стресс-тесты (проверка защиты)

### 1. Большой цикл while (ограниченный)

```lua
local count = 0
while count < 10000 do
  count = count + 1
  if count == 1000 then
    print("Достигнуто 1000 итераций")
  end
end
print("Цикл завершен, итераций:", count)
```

### 2. Большой цикл for

```lua
local max = 50000
for i = 1, max do
  if i == 10000 then
    print("Достигнуто 10000 итераций")
  end
  if i == max then
    print("Достигнуто максимума:", max)
  end
end
print("Цикл завершен")
```

### 3. Глубокая рекурсия (ограниченная)

```lua
function deepRecursion(level, max)
  if level >= max then
    return level
  end
  return deepRecursion(level + 1, max)
end
local result = deepRecursion(0, 500)
print("Глубина рекурсии:", result)
```

### 4. Быстрая сортировка (100 элементов)

```lua
function quicksort(arr, low, high)
  if low < high then
    local pivot = partition(arr, low, high)
    quicksort(arr, low, pivot - 1)
    quicksort(arr, pivot + 1, high)
  end
end

function partition(arr, low, high)
  local pivot = arr[high]
  local i = low - 1
  for j = low, high - 1 do
    if arr[j] < pivot then
      i = i + 1
      arr[i], arr[j] = arr[j], arr[i]
    end
  end
  arr[i + 1], arr[high] = arr[high], arr[i + 1]
  return i + 1
end

local arr = {}
for i = 1, 100 do
  arr[i] = math.random(1, 1000)
end

quicksort(arr, 1, #arr)
print("Отсортировано элементов:", #arr)
print("Первый элемент:", arr[1])
print("Последний элемент:", arr[#arr])
```

### 5. Числа Фибоначчи

```lua
-- ВАЖНО: Большие числа Фибоначчи могут вызвать переполнение!
-- Используйте небольшие значения (до 50) для корректной работы

function fibonacci(n)
  if n <= 1 then
    return n
  end
  local a, b = 0, 1
  for i = 2, n do
    a, b = b, a + b
    -- Проверка на переполнение (для больших чисел)
    if b < 0 then
      return "Переполнение при n=" .. i
    end
  end
  return b
end

print("Fibonacci(10):", fibonacci(10))
print("Fibonacci(20):", fibonacci(20))
print("Fibonacci(30):", fibonacci(30))
print("Fibonacci(40):", fibonacci(40))
-- Fibonacci(50) и больше могут вызвать переполнение!
```

### 6. Тройной вложенный цикл (10,000 итераций)

```lua
local count = 0
for i = 1, 25 do
  for j = 1, 20 do
    for k = 1, 20 do
      count = count + 1
    end
  end
end
print("Всего итераций:", count)
```

### 7. Большая таблица (1,000 элементов)

```lua
local bigTable = {}
for i = 1, 1000 do
  bigTable[i] = {
    id = i,
    name = "Item " .. i,
    value = i * 2
  }
end
print("Создано элементов:", #bigTable)
print("Первый элемент ID:", bigTable[1].id)
print("Последний элемент ID:", bigTable[#bigTable].id)
```

### 8. Строковые операции (100 конкатенаций)

```lua
local result = ""
for i = 1, 100 do
  result = result .. "A" .. i .. "B"
end
print("Длина строки:", #result)
print("Первые 30 символов:", string.sub(result, 1, 30))
```

### 9. Математические расчеты

```lua
-- ВАЖНО: Большие факториалы могут вызвать переполнение!
-- В JavaScript/Lua числа имеют ограниченный размер (2^53)
function factorial(n)
  if n <= 1 then
    return 1
  end
  local result = 1
  for i = 2, n do
    result = result * i
    -- Проверка на переполнение
    if result < 0 or result == math.huge then
      return "Переполнение при n=" .. i
    end
  end
  return result
end

print("Факториал 10:", factorial(10))
print("Факториал 15:", factorial(15))
print("Факториал 20:", factorial(20))
-- Факториалы больше 20 могут вызвать переполнение!
```

### 10. Проверка безопасности

```lua
local checks = {}
checks.dofile = (dofile == nil)
checks.require = (require == nil)
checks.io = (io == nil)
checks.os = (os == nil)

for key, value in pairs(checks) do
  print(key .. " заблокирован:", value)
end
```

### 11. Длинная строка

```lua
local code = "local x = 1"
for i = 2, 100 do
  code = code .. " + " .. i
end
print("Длина кода:", #code)
print("Первые 50 символов:", string.sub(code, 1, 50))
```

---

## Тесты на защиту (должны быть заблокированы)

### ❌ Бесконечный цикл (должен быть заблокирован)

```lua
-- Этот код должен быть заблокирован системой защиты
while true do
  print("Бесконечный цикл")
end
```

### ❌ Использование math.huge (должно быть заблокировано)

```lua
-- Этот код должен быть заблокирован системой защиты
for i = 1, math.huge do
  print(i)
end
```

### ❌ Опасные функции (должны быть заблокированы)

```lua
-- Эти функции должны быть недоступны
dofile("test.lua")
require("module")
io.open("file.txt")
os.execute("command")
```

---

## Как использовать

1. **В редакторе кода на странице урока:**
   - Откройте урок с редактором Lua
   - Скопируйте любой тестовый код
   - Вставьте в редактор
   - Нажмите "Выполнить"
   - Проверьте результат

2. **Для проверки защиты:**
   - Попробуйте запустить тесты из раздела "Тесты на защиту"
   - Они должны быть заблокированы системой безопасности
   - Вы должны увидеть сообщение об ошибке

3. **Для проверки функциональности:**
   - Запустите базовые тесты (1-12)
   - Все они должны выполниться успешно
   - Проверьте вывод на соответствие ожидаемому результату

---

## Ограничения системы

- **Максимальный размер кода:** 50KB
- **Максимальное время выполнения:** 2 секунды
- **Максимальное количество строк вывода:** 1,000
- **Максимальный размер вывода:** 100KB
- **Максимальная длина строки вывода:** 1,000 символов

---

## Примечания

- Все тесты протестированы и работают корректно
- Защита от опасного кода активна и блокирует потенциально вредные операции
- Если тест не работает, проверьте синтаксис и убедитесь, что используете правильные функции Lua

## ⚠️ Важные замечания

### Переполнение чисел

- **Числа Фибоначчи**: При значениях больше 50 может произойти переполнение целых чисел, что приведет к отрицательным результатам
- **Факториалы**: При значениях больше 20-30 может произойти переполнение
- **Большие вычисления**: Используйте разумные значения для избежания переполнения

### Рекомендации

- Для тестирования используйте небольшие значения (до 50)
- Если нужны большие числа, используйте строки или специальные библиотеки
- Проверяйте результаты на разумность (отрицательные числа = переполнение)

