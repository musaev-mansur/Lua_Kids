/**
 * Асинхронная версия стресс-тестов
 * Выполняет тесты по одному с задержками, чтобы не блокировать UI
 */

import { createLuaExecutor } from './lua-executor'
import type { StressTestResult } from './lua-stress-test'

/**
 * Задержка между тестами (в мс)
 */
const DELAY_BETWEEN_TESTS = 100

/**
 * Асинхронно выполняет все стресс-тесты
 */
export async function runAllStressTestsAsync(
  onProgress?: (current: number, total: number, testName: string) => void
): Promise<{ allPassed: boolean; results: StressTestResult[] }> {
  const results: StressTestResult[] = []
  
  // Определяем все тесты (безопасные версии без реальных бесконечных циклов)
  const tests = [
    {
      name: "1. Большой цикл while (ограниченный)",
      code: `local count = 0
while count < 10000 do
  count = count + 1
  if count == 1000 then
    print("Достигнуто 1000 итераций")
  end
end
print("Цикл завершен, итераций:", count)`,
      validator: (result: any) => result.error === null && result.output.some((o: string) => o.includes('10000')),
      expected: "Должен выполнить 10,000 итераций и завершиться"
    },
    {
      name: "2. Большой цикл for",
      code: `local max = 50000
for i = 1, max do
  if i == 10000 then
    print("Достигнуто 10000 итераций")
  end
  if i == max then
    print("Достигнуто максимума:", max)
  end
end
print("Цикл завершен")`,
      validator: (result: any) => result.error === null,
      expected: "Должен завершиться успешно"
    },
    {
      name: "3. Глубокая рекурсия (ограниченная)",
      code: `function deepRecursion(level, max)
  if level >= max then
    return level
  end
  return deepRecursion(level + 1, max)
end
local result = deepRecursion(0, 500)
print("Глубина рекурсии:", result)`,
      validator: (result: any) => result.error === null || result.error.includes('stack'),
      expected: "Должен обработать или выдать ошибку стека"
    },
    {
      name: "4. Глубокая рекурсия (100 уровней)",
      code: `function deepRecursion(level)
  if level <= 0 then
    return 0
  end
  return 1 + deepRecursion(level - 1)
end
local result = deepRecursion(100)
print("Глубина рекурсии:", result)`,
      validator: (result: any) => result.error === null || result.error.includes('stack'),
      expected: "Должен обработать или выдать ошибку стека"
    },
    {
      name: "5. Быстрая сортировка (100 элементов)",
      code: `function quicksort(arr, low, high)
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
print("Последний элемент:", arr[#arr])`,
      validator: (result: any) => result.error === null,
      expected: "Должен успешно отсортировать массив"
    },
    {
      name: "6. Числа Фибоначчи",
      code: `function fibonacci(n)
  if n <= 1 then
    return n
  end
  local a, b = 0, 1
  for i = 2, n do
    a, b = b, a + b
  end
  return b
end

print("Fibonacci(50):", fibonacci(50))
print("Fibonacci(100):", fibonacci(100))`,
      validator: (result: any) => result.error === null,
      expected: "Должен вычислить числа Фибоначчи"
    },
    {
      name: "7. Тройной вложенный цикл (10,000 итераций)",
      code: `local count = 0
for i = 1, 25 do
  for j = 1, 20 do
    for k = 1, 20 do
      count = count + 1
    end
  end
end
print("Всего итераций:", count)`,
      validator: (result: any) => result.error === null,
      expected: "Должен выполнить 10,000 итераций"
    },
    {
      name: "8. Большая таблица (1,000 элементов)",
      code: `local bigTable = {}
for i = 1, 1000 do
  bigTable[i] = {
    id = i,
    name = "Item " .. i,
    value = i * 2
  }
end
print("Создано элементов:", #bigTable)
print("Первый элемент ID:", bigTable[1].id)
print("Последний элемент ID:", bigTable[#bigTable].id)`,
      validator: (result: any) => result.error === null,
      expected: "Должен создать большую таблицу без ошибок"
    },
    {
      name: "9. Строковые операции (100 конкатенаций)",
      code: `local result = ""
for i = 1, 100 do
  result = result .. "A" .. i .. "B"
end
print("Длина строки:", #result)
print("Первые 30 символов:", string.sub(result, 1, 30))`,
      validator: (result: any) => result.error === null,
      expected: "Должен выполнить конкатенации строк"
    },
    {
      name: "10. Математические расчеты",
      code: `function factorial(n)
  if n <= 1 then
    return 1
  end
  local result = 1
  for i = 2, n do
    result = result * i
  end
  return result
end

print("Факториал 20:", factorial(20))
print("Факториал 30:", factorial(30))`,
      validator: (result: any) => result.error === null,
      expected: "Должен выполнить математические расчеты"
    },
    {
      name: "11. Проверка безопасности",
      code: `local checks = {}
checks.dofile = (dofile == nil)
checks.require = (require == nil)
checks.io = (io == nil)
checks.os = (os == nil)

for key, value in pairs(checks) do
  print(key .. " заблокирован:", value)
end`,
      validator: (result: any) => result.error === null && 
                 result.output.some((o: string) => o.includes('true')),
      expected: "Запрещенные функции должны быть недоступны"
    },
    {
      name: "12. Длинная строка",
      code: `local code = "local x = 1"
for i = 2, 100 do
  code = code .. " + " .. i
end
print("Длина кода:", #code)
print("Первые 50 символов:", string.sub(code, 1, 50))`,
      validator: (result: any) => result.error === null,
      expected: "Должен обработать длинную строку"
    }
  ]

  // Выполняем тесты по одному с задержками
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i]
    
    if (onProgress) {
      onProgress(i + 1, tests.length, test.name)
    }

    const executor = createLuaExecutor()
    try {
      const startTime = Date.now()
      const result = executor.execute(test.code)
      const executionTime = Date.now() - startTime
      const passed = test.validator(result)
      executor.destroy()

      results.push({
        name: test.name,
        passed,
        error: result.error || undefined,
        output: result.output.length > 0 ? result.output : undefined,
        executionTime,
        expectedBehavior: test.expected
      })
    } catch (error: any) {
      executor.destroy()
      results.push({
        name: test.name,
        passed: false,
        error: error.message || String(error),
        expectedBehavior: test.expected
      })
    }

    // Задержка между тестами, чтобы не блокировать UI
    // Используем двойной requestAnimationFrame для гарантированного обновления UI
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, DELAY_BETWEEN_TESTS)
        })
      })
    })
  }

  const allPassed = results.every(r => r.passed)
  return { allPassed, results }
}

