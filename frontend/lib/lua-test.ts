/**
 * Комплексный тест Lua Executor
 * Проверяет поддержку всех основных конструкций языка Lua
 */

import { createLuaExecutor } from './lua-executor'

export interface TestResult {
  name: string
  passed: boolean
  error?: string
  output?: string[]
}

/**
 * Комплексный тест всех конструкций Lua
 */
export function runLuaComprehensiveTest(): TestResult[] {
  const executor = createLuaExecutor()
  const results: TestResult[] = []

  // Тест 1: Базовые операции и переменные
  const test1 = `
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
`
  results.push(runTest("1. Базовые операции и переменные", test1, executor))

  // Тест 2: Строки
  const test2 = `
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
`
  results.push(runTest("2. Строки и строковые операции", test2, executor))

  // Тест 3: Таблицы (объекты)
  const test3 = `
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
`
  results.push(runTest("3. Таблицы (массивы и объекты)", test3, executor))

  // Тест 4: Функции
  const test4 = `
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
`
  results.push(runTest("4. Функции (обычные, анонимные, высшего порядка)", test4, executor))

  // Тест 5: Ветвления (if/else)
  const test5 = `
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
`
  results.push(runTest("5. Ветвления (if/else/elseif)", test5, executor))

  // Тест 6: Циклы for
  const test6 = `
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
`
  results.push(runTest("6. Циклы for (числовые, ipairs, pairs)", test6, executor))

  // Тест 7: Циклы while и repeat
  const test7 = `
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
`
  results.push(runTest("7. Циклы while и repeat-until", test7, executor))

  // Тест 8: Математические функции
  const test8 = `
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
`
  results.push(runTest("8. Математические функции", test8, executor))

  // Тест 9: Работа с таблицами (table.*)
  const test9 = `
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
`
  results.push(runTest("9. Функции работы с таблицами", test9, executor))

  // Тест 10: Сложная комбинация
  const test10 = `
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
`
  results.push(runTest("10. Комплексный пример (все вместе)", test10, executor))

  // Тест 11: Рекурсия
  const test11 = `
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
`
  results.push(runTest("11. Рекурсия", test11, executor))

  // Тест 12: Замыкания
  const test12 = `
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
`
  results.push(runTest("12. Замыкания", test12, executor))

  executor.destroy()
  return results
}

/**
 * Запускает один тест
 */
function runTest(name: string, code: string, executor: any): TestResult {
  try {
    const result = executor.execute(code)
    
    if (result.error) {
      return {
        name,
        passed: false,
        error: result.error,
        output: result.output
      }
    }
    
    return {
      name,
      passed: true,
      output: result.output
    }
  } catch (error: any) {
    return {
      name,
      passed: false,
      error: error.message || String(error)
    }
  }
}

/**
 * Выводит результаты тестов в консоль
 */
export function printTestResults(results: TestResult[]): void {
  console.log("\n" + "=".repeat(60))
  console.log("РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ LUA EXECUTOR")
  console.log("=".repeat(60))
  
  let passedCount = 0
  let failedCount = 0
  
  results.forEach((result, index) => {
    const status = result.passed ? "✓ PASS" : "✗ FAIL"
    const icon = result.passed ? "✅" : "❌"
    
    console.log(`\n${icon} ${result.name}`)
    console.log(`   Статус: ${status}`)
    
    if (result.passed) {
      passedCount++
      if (result.output && result.output.length > 0) {
        console.log(`   Вывод (первые 3 строки):`)
        result.output.slice(0, 3).forEach((line, i) => {
          console.log(`     ${i + 1}. ${line}`)
        })
        if (result.output.length > 3) {
          console.log(`     ... и еще ${result.output.length - 3} строк`)
        }
      }
    } else {
      failedCount++
      console.log(`   Ошибка: ${result.error}`)
      if (result.output && result.output.length > 0) {
        console.log(`   Вывод до ошибки:`)
        result.output.slice(0, 2).forEach((line, i) => {
          console.log(`     ${i + 1}. ${line}`)
        })
      }
    }
  })
  
  console.log("\n" + "=".repeat(60))
  console.log(`ИТОГО: ${passedCount} пройдено, ${failedCount} провалено из ${results.length}`)
  console.log("=".repeat(60) + "\n")
  
  if (failedCount === 0) {
    console.log("🎉 Все тесты пройдены! Lua Executor полностью функционален!")
  } else {
    console.log("⚠️  Некоторые тесты провалены. Проверьте ошибки выше.")
  }
}

/**
 * Запускает все тесты и возвращает сводку
 */
export function runAllTests(): { allPassed: boolean; results: TestResult[] } {
  const results = runLuaComprehensiveTest()
  const allPassed = results.every(r => r.passed)
  
  printTestResults(results)
  
  return { allPassed, results }
}

