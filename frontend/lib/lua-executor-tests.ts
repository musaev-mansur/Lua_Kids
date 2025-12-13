/**
 * Тесты для Lua Executor
 * Проверяет работу с различными конструкциями Lua
 */

import { createLuaStepExecutor, LuaStepExecutor } from './lua-step-executor'

export interface TestCase {
  name: string
  code: string
  expectedOutput?: string[]
  description: string
}

export const testCases: TestCase[] = [
  // Базовые переменные
  {
    name: 'Базовые переменные',
    code: `local name = "Roblox"
local age = 10
local isActive = true
print(name)
print(age)
print(isActive)`,
    expectedOutput: ['Roblox', '10', 'true'],
    description: 'Проверка работы с базовыми типами данных'
  },

  // Арифметические операции
  {
    name: 'Арифметические операции',
    code: `local x = 10
local y = 20
local sum = x + y
local product = x * y
print("Сумма: " .. sum)
print("Произведение: " .. product)`,
    expectedOutput: ['Сумма: 30', 'Произведение: 200'],
    description: 'Проверка арифметических операций'
  },

  // Таблицы/массивы
  {
    name: 'Таблицы и массивы',
    code: `local fruits = {"apple", "banana", "cherry"}
print(fruits[1])
print(fruits[2])
print(fruits[3])
local count = #fruits
print("Всего: " .. count)`,
    expectedOutput: ['apple', 'banana', 'cherry', 'Всего: 3'],
    description: 'Проверка работы с таблицами/массивами'
  },

  // Условия
  {
    name: 'Условные операторы',
    code: `local score = 85
if score >= 90 then
    print("Отлично!")
elseif score >= 70 then
    print("Хорошо!")
else
    print("Нужно улучшить")
end`,
    expectedOutput: ['Хорошо!'],
    description: 'Проверка условных операторов if/elseif/else'
  },

  // Цикл for
  {
    name: 'Цикл for',
    code: `for i = 1, 5 do
    print("Число: " .. i)
end`,
    expectedOutput: ['Число: 1', 'Число: 2', 'Число: 3', 'Число: 4', 'Число: 5'],
    description: 'Проверка цикла for'
  },

  // Цикл for с таблицей
  {
    name: 'Цикл for с таблицей',
    code: `local items = {"sword", "shield", "potion"}
for i = 1, #items do
    print("Предмет " .. i .. ": " .. items[i])
end`,
    expectedOutput: ['Предмет 1: sword', 'Предмет 2: shield', 'Предмет 3: potion'],
    description: 'Проверка цикла for с таблицей'
  },

  // Цикл while
  {
    name: 'Цикл while',
    code: `local count = 1
while count <= 3 do
    print("Счет: " .. count)
    count = count + 1
end`,
    expectedOutput: ['Счет: 1', 'Счет: 2', 'Счет: 3'],
    description: 'Проверка цикла while'
  },

  // Функции
  {
    name: 'Функции',
    code: `function greet(name)
    return "Привет, " .. name .. "!"
end

local message = greet("Roblox")
print(message)`,
    expectedOutput: ['Привет, Roblox!'],
    description: 'Проверка работы с функциями'
  },

  // Функции с параметрами
  {
    name: 'Функции с параметрами',
    code: `function add(a, b)
    return a + b
end

local result1 = add(5, 3)
local result2 = add(10, 20)
print("Результат 1: " .. result1)
print("Результат 2: " .. result2)`,
    expectedOutput: ['Результат 1: 8', 'Результат 2: 30'],
    description: 'Проверка функций с параметрами'
  },

  // Вложенные циклы
  {
    name: 'Вложенные циклы',
    code: `for i = 1, 2 do
    for j = 1, 2 do
        print("i=" .. i .. ", j=" .. j)
    end
end`,
    expectedOutput: ['i=1, j=1', 'i=1, j=2', 'i=2, j=1', 'i=2, j=2'],
    description: 'Проверка вложенных циклов'
  },

  // Таблицы с ключами
  {
    name: 'Таблицы с ключами',
    code: `local player = {
    name = "Player1",
    level = 5,
    xp = 100
}
print(player.name)
print("Уровень: " .. player.level)
print("Опыт: " .. player.xp)`,
    expectedOutput: ['Player1', 'Уровень: 5', 'Опыт: 100'],
    description: 'Проверка таблиц с именованными ключами'
  },

  // Строковые операции
  {
    name: 'Строковые операции',
    code: `local str1 = "Hello"
local str2 = "World"
local combined = str1 .. " " .. str2
print(combined)
print("Длина: " .. #combined)`,
    expectedOutput: ['Hello World', 'Длина: 11'],
    description: 'Проверка строковых операций'
  },

  // Математические функции
  {
    name: 'Математические функции',
    code: `local num = 9
print("Квадратный корень: " .. math.sqrt(num))
print("Максимум: " .. math.max(5, 10, 3))
print("Минимум: " .. math.min(5, 10, 3))`,
    expectedOutput: ['Квадратный корень: 3', 'Максимум: 10', 'Минимум: 3'],
    description: 'Проверка математических функций'
  },

  // Логические операции
  {
    name: 'Логические операции',
    code: `local a = true
local b = false
print("a and b: " .. tostring(a and b))
print("a or b: " .. tostring(a or b))
print("not a: " .. tostring(not a))`,
    expectedOutput: ['a and b: false', 'a or b: true', 'not a: false'],
    description: 'Проверка логических операций'
  },

  // Комплексный пример
  {
    name: 'Комплексный пример',
    code: `local players = {
    {name = "Alice", score = 100},
    {name = "Bob", score = 150},
    {name = "Charlie", score = 120}
}

function findBestPlayer(players)
    local best = players[1]
    for i = 2, #players do
        if players[i].score > best.score then
            best = players[i]
        end
    end
    return best
end

local best = findBestPlayer(players)
print("Лучший игрок: " .. best.name)
print("Счет: " .. best.score)`,
    expectedOutput: ['Лучший игрок: Bob', 'Счет: 150'],
    description: 'Комплексный пример с функциями, циклами и таблицами'
  },
]

/**
 * Запускает все тесты
 */
export async function runAllTests(): Promise<{
  passed: number
  failed: number
  results: Array<{
    name: string
    passed: boolean
    error?: string
    output?: string[]
    expectedOutput?: string[]
  }>
}> {
  const results: Array<{
    name: string
    passed: boolean
    error?: string
    output?: string[]
    expectedOutput?: string[]
  }> = []

  let passed = 0
  let failed = 0

  // Динамически импортируем executor только при необходимости
  let executor: any = null
  
  try {
    for (const testCase of testCases) {
      try {
        if (!executor) {
          executor = createLuaStepExecutor()
        }
        
        const result = executor.execute(testCase.code)

        if (result.error) {
          results.push({
            name: testCase.name,
            passed: false,
            error: result.error,
          })
          failed++
        } else {
          const outputMatches = testCase.expectedOutput
            ? JSON.stringify(result.output) === JSON.stringify(testCase.expectedOutput)
            : true

          results.push({
            name: testCase.name,
            passed: outputMatches && !result.error,
            output: result.output,
            expectedOutput: testCase.expectedOutput,
          })

          if (outputMatches && !result.error) {
            passed++
          } else {
            failed++
          }
        }
      } catch (error: any) {
        results.push({
          name: testCase.name,
          passed: false,
          error: error.message || String(error),
        })
        failed++
      }
    }
  } finally {
    if (executor) {
      try {
        executor.destroy()
      } catch (e) {
        // Игнорируем ошибки при уничтожении
      }
    }
  }

  return { passed, failed, results }
}

/**
 * Запускает тест пошагово
 */
export function runStepByStepTest(code: string): {
  steps: any[]
  error: string | null
  executionTime: number
} {
  const executor = createLuaStepExecutor()
  try {
    const result = executor.executeStepByStep(code)
    return result
  } finally {
    try {
      executor.destroy()
    } catch (e) {
      // Игнорируем ошибки при уничтожении
    }
  }
}

