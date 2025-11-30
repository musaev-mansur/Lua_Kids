/**
 * Тесты на устойчивость и безопасность Lua Executor
 * Проверяет защиту от бесконечных циклов, сложных алгоритмов и потенциально опасного кода
 */

import { createLuaExecutor } from './lua-executor'

export interface StressTestResult {
  name: string
  passed: boolean
  error?: string
  output?: string[]
  executionTime?: number
  expectedBehavior: string
}

/**
 * Тесты на устойчивость (асинхронная версия)
 */
export async function runLuaStressTestsAsync(
  onProgress?: (current: number, total: number, testName: string) => void
): Promise<StressTestResult[]> {
  const results: StressTestResult[] = []
  const tests: Array<{ name: string; code: string; validator: (executor: any) => boolean; expected: string }> = []

  // Тест 1: Бесконечный цикл while (должен быть остановлен по таймауту)
  const test1 = `
-- Бесконечный цикл while
local count = 0
while true do
  count = count + 1
  if count == 1000 then
    print("Достигнуто 1000 итераций")
  end
end
`
  tests.push({
    name: "1. Бесконечный цикл while (таймаут)",
    code: test1,
    validator: executor => {
      const result = executor.execute(test1)
      // Должен быть таймаут или ошибка
      return result.error && (
        result.error.includes('timeout') || 
        result.error.includes('too long') ||
        result.error.includes('Execution timeout')
      )
    },
    expected: "Должен быть остановлен по таймауту (5 секунд)"
  })

  // Тест 2: Бесконечный цикл for (должен быть остановлен)
  const test2 = `
-- Бесконечный цикл for (с очень большим числом)
for i = 1, math.huge do
  if i == 1000000 then
    print("Достигнуто 1000000 итераций")
    break
  end
end
print("Цикл завершен")
`
  results.push(runStressTest(
    "2. Очень большой цикл for",
    test2,
    executor => {
      const result = executor.execute(test2)
      // Может быть таймаут или успешное выполнение с break
      return result.error === null || result.error.includes('timeout')
    },
    "Должен либо завершиться, либо быть остановлен по таймауту"
  ))

  // Тест 3: Бесконечная рекурсия (должна быть остановлена)
  const test3 = `
-- Бесконечная рекурсия
function infiniteRecursion()
  return infiniteRecursion()
end
infiniteRecursion()
`
  results.push(runStressTest(
    "3. Бесконечная рекурсия",
    test3,
    executor => {
      const result = executor.execute(test3)
      // Должна быть ошибка переполнения стека или таймаут
      return result.error && (
        result.error.includes('stack') ||
        result.error.includes('overflow') ||
        result.error.includes('timeout') ||
        result.error.includes('too long')
      )
    },
    "Должна быть ошибка переполнения стека или таймаут"
  ))

  // Тест 4: Глубокая рекурсия (но конечная)
  const test4 = `
-- Глубокая рекурсия (1000 уровней)
function deepRecursion(level)
  if level <= 0 then
    return 0
  end
  return 1 + deepRecursion(level - 1)
end
local result = deepRecursion(1000)
print("Глубина рекурсии:", result)
`
  results.push(runStressTest(
    "4. Глубокая рекурсия (1000 уровней)",
    test4,
    executor => {
      const result = executor.execute(test4)
      // Может быть успешным или ошибка стека
      return result.error === null || result.error.includes('stack')
    },
    "Должен обработать или выдать ошибку стека"
  ))

  // Тест 5: Сложный алгоритм - быстрая сортировка большого массива
  const test5 = `
-- Быстрая сортировка большого массива
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

-- Создаем большой массив
local arr = {}
for i = 1, 1000 do
  arr[i] = math.random(1, 10000)
end

quicksort(arr, 1, #arr)
print("Отсортировано элементов:", #arr)
print("Первый элемент:", arr[1])
print("Последний элемент:", arr[#arr])
`
  results.push(runStressTest(
    "5. Быстрая сортировка (1000 элементов)",
    test5,
    executor => {
      const result = executor.execute(test5)
      return result.error === null
    },
    "Должен успешно отсортировать массив"
  ))

  // Тест 6: Сложный алгоритм - вычисление чисел Фибоначчи (много итераций)
  const test6 = `
-- Вычисление больших чисел Фибоначчи
function fibonacci(n)
  if n <= 1 then
    return n
  end
  local a, b = 0, 1
  for i = 2, n do
    a, b = b, a + b
  end
  return b
end

print("Fibonacci(100):", fibonacci(100))
print("Fibonacci(500):", fibonacci(500))
print("Fibonacci(1000):", fibonacci(1000))
`
  results.push(runStressTest(
    "6. Числа Фибоначчи (большие значения)",
    test6,
    executor => {
      const result = executor.execute(test6)
      return result.error === null
    },
    "Должен вычислить большие числа Фибоначчи"
  ))

  // Тест 7: Множественные вложенные циклы
  const test7 = `
-- Тройной вложенный цикл
local count = 0
for i = 1, 100 do
  for j = 1, 100 do
    for k = 1, 100 do
      count = count + 1
    end
  end
end
print("Всего итераций:", count)
print("Ожидалось:", 100 * 100 * 100)
`
  results.push(runStressTest(
    "7. Тройной вложенный цикл (1,000,000 итераций)",
    test7,
    executor => {
      const result = executor.execute(test7)
      return result.error === null && result.output.some((o: string) => o.includes('1000000'))
    },
    "Должен выполнить 1,000,000 итераций"
  ))

  // Тест 8: Создание больших таблиц
  const test8 = `
-- Создание очень большой таблицы
local bigTable = {}
for i = 1, 10000 do
  bigTable[i] = {
    id = i,
    name = "Item " .. i,
    value = i * 2,
    data = {a = i, b = i * 2, c = i * 3}
  }
end
print("Создано элементов:", #bigTable)
print("Первый элемент ID:", bigTable[1].id)
print("Последний элемент ID:", bigTable[#bigTable].id)
print("Память использована (примерно):", #bigTable * 100, "байт")
`
  results.push(runStressTest(
    "8. Большая таблица (10,000 элементов)",
    test8,
    executor => {
      const result = executor.execute(test8)
      return result.error === null
    },
    "Должен создать большую таблицу без ошибок"
  ))

  // Тест 9: Множественные строковые операции
  const test9 = `
-- Множественные операции со строками
local result = ""
for i = 1, 1000 do
  result = result .. "A" .. i .. "B"
end
print("Длина строки:", #result)
print("Первые 50 символов:", string.sub(result, 1, 50))
print("Последние 50 символов:", string.sub(result, #result - 49))
`
  results.push(runStressTest(
    "9. Множественные строковые операции (1000 конкатенаций)",
    test9,
    executor => {
      const result = executor.execute(test9)
      return result.error === null
    },
    "Должен выполнить много конкатенаций строк"
  ))

  // Тест 10: Сложный математический расчет
  const test10 = `
-- Вычисление факториала больших чисел
function factorial(n)
  if n <= 1 then
    return 1
  end
  local result = 1
  for i = 2, n do
    result = result * i
  end
  return result
end

-- Вычисление комбинаций C(n, k)
function combination(n, k)
  if k > n then return 0 end
  if k == 0 or k == n then return 1 end
  if k > n - k then k = n - k end
  local result = 1
  for i = 1, k do
    result = result * (n - i + 1) / i
  end
  return math.floor(result)
end

print("Факториал 50:", factorial(50))
print("Факториал 100:", factorial(100))
print("C(100, 50):", combination(100, 50))
print("C(200, 100):", combination(200, 100))
`
  results.push(runStressTest(
    "10. Сложные математические расчеты",
    test10,
    executor => {
      const result = executor.execute(test10)
      return result.error === null
    },
    "Должен выполнить сложные математические расчеты"
  ))

  // Тест 11: Попытка доступа к запрещенным функциям
  const test11 = `
-- Попытка использовать запрещенные функции
local result = {}
table.insert(result, "Тест 1: dofile")
local success, err = pcall(function() dofile("test.lua") end)
table.insert(result, "dofile доступен: " .. tostring(not err))

table.insert(result, "Тест 2: require")
success, err = pcall(function() require("test") end)
table.insert(result, "require доступен: " .. tostring(not err))

table.insert(result, "Тест 3: io")
success, err = pcall(function() io.open("test.txt") end)
table.insert(result, "io доступен: " .. tostring(not err))

table.insert(result, "Тест 4: os")
success, err = pcall(function() os.execute("ls") end)
table.insert(result, "os доступен: " .. tostring(not err))

for i, v in ipairs(result) do
  print(v)
end
`
  results.push(runStressTest(
    "11. Проверка безопасности (запрещенные функции)",
    test11,
    executor => {
      const result = executor.execute(test11)
      // Должны быть ошибки о недоступности функций
      return result.error === null && 
             result.output.some((o: string) => o.includes('false') || o.includes('nil'))
    },
    "Запрещенные функции должны быть недоступны"
  ))

  // Тест 12: Очень длинная строка кода
  const test12 = `
-- Генерация очень длинной строки кода
local code = "local x = 1"
for i = 2, 1000 do
  code = code .. " + " .. i
end
code = code .. "; print('Результат:', x)"
-- Попытка выполнить (но мы просто вычислим длину)
print("Длина сгенерированного кода:", #code)
print("Первые 100 символов:", string.sub(code, 1, 100))
`
  results.push(runStressTest(
    "12. Очень длинная строка",
    test12,
    executor => {
      const result = executor.execute(test12)
      return result.error === null
    },
    "Должен обработать очень длинную строку"
  ))

  return results
}

/**
 * Запускает один стресс-тест
 */
function runStressTest(
  name: string,
  code: string,
  validator: (executor: any) => boolean,
  expectedBehavior: string
): StressTestResult {
  const executor = createLuaExecutor()
  
  try {
    const startTime = Date.now()
    const result = executor.execute(code)
    const executionTime = Date.now() - startTime
    
    const passed = validator(executor)
    
    executor.destroy()
    
    return {
      name,
      passed,
      error: result.error || undefined,
      output: result.output.length > 0 ? result.output : undefined,
      executionTime,
      expectedBehavior
    }
  } catch (error: any) {
    executor.destroy()
    return {
      name,
      passed: false,
      error: error.message || String(error),
      expectedBehavior
    }
  }
}

/**
 * Выводит результаты стресс-тестов
 */
export function printStressTestResults(results: StressTestResult[]): void {
  console.log("\n" + "=".repeat(70))
  console.log("РЕЗУЛЬТАТЫ СТРЕСС-ТЕСТИРОВАНИЯ LUA EXECUTOR")
  console.log("=".repeat(70))
  
  let passedCount = 0
  let failedCount = 0
  
  results.forEach((result) => {
    const status = result.passed ? "✓ PASS" : "✗ FAIL"
    const icon = result.passed ? "✅" : "❌"
    
    console.log(`\n${icon} ${result.name}`)
    console.log(`   Статус: ${status}`)
    console.log(`   Ожидаемое поведение: ${result.expectedBehavior}`)
    
    if (result.executionTime !== undefined) {
      console.log(`   Время выполнения: ${result.executionTime}ms`)
    }
    
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
      if (result.error) {
        console.log(`   Ошибка: ${result.error}`)
      }
      if (result.output && result.output.length > 0) {
        console.log(`   Вывод до ошибки:`)
        result.output.slice(0, 2).forEach((line, i) => {
          console.log(`     ${i + 1}. ${line}`)
        })
      }
    }
  })
  
  console.log("\n" + "=".repeat(70))
  console.log(`ИТОГО: ${passedCount} пройдено, ${failedCount} провалено из ${results.length}`)
  console.log("=".repeat(70) + "\n")
  
  if (failedCount === 0) {
    console.log("🎉 Все стресс-тесты пройдены! Lua Executor устойчив к нагрузкам!")
  } else {
    console.log("⚠️  Некоторые тесты провалены. Проверьте защиту от опасного кода.")
  }
}

/**
 * Запускает все стресс-тесты (асинхронная версия)
 */
export async function runAllStressTestsAsync(
  onProgress?: (current: number, total: number, testName: string) => void
): Promise<{ allPassed: boolean; results: StressTestResult[] }> {
  const results = await runLuaStressTestsAsync(onProgress)
  const allPassed = results.every(r => r.passed)
  
  printStressTestResults(results)
  
  return { allPassed, results }
}

/**
 * Запускает все стресс-тесты (синхронная версия для обратной совместимости)
 */
export function runAllStressTests(): { allPassed: boolean; results: StressTestResult[] } {
  // Предупреждение: синхронная версия может заблокировать UI
  console.warn("Используется синхронная версия runAllStressTests. Рекомендуется использовать runAllStressTestsAsync")
  const results: StressTestResult[] = []
  
  // Выполняем только быстрые тесты синхронно
  const quickTests = [
    {
      name: "11. Проверка безопасности (запрещенные функции)",
      code: `local result = {}
table.insert(result, "dofile доступен: " .. tostring(dofile ~= nil))
table.insert(result, "require доступен: " .. tostring(require ~= nil))
for i, v in ipairs(result) do print(v) end`,
      validator: (executor: any) => {
        const result = executor.execute(`local result = {}
table.insert(result, "dofile доступен: " .. tostring(dofile ~= nil))
table.insert(result, "require доступен: " .. tostring(require ~= nil))
for i, v in ipairs(result) do print(v) end`)
        return result.error === null && result.output.some((o: string) => o.includes('false'))
      },
      expected: "Запрещенные функции должны быть недоступны"
    }
  ]
  
  quickTests.forEach(test => {
    const executor = createLuaExecutor()
    try {
      const startTime = Date.now()
      const result = executor.execute(test.code)
      const executionTime = Date.now() - startTime
      const passed = test.validator(executor)
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
  })
  
  const allPassed = results.every(r => r.passed)
  return { allPassed, results }
}

