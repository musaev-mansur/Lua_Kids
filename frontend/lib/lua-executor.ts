/**
 * Lua Executor с использованием Fengari
 * Обеспечивает безопасное выполнение Lua кода в браузере
 */

// Загружаем заглушку для process.binding перед импортом fengari
import './process-stub'

import fengari from 'fengari'

const { lua, lauxlib, lualib, to_jsstring, to_luastring } = fengari

// Константы безопасности
const MAX_CODE_SIZE = 50000 // Максимальный размер кода (50KB)
const MAX_OUTPUT_LINES = 1000 // Максимальное количество строк вывода
const MAX_OUTPUT_LENGTH = 100000 // Максимальная общая длина вывода (100KB)
const MAX_EXECUTION_TIME = 2000 // Максимальное время выполнения (2 секунды)

// Создаем безопасную среду выполнения Lua
export class LuaExecutor {
  private L: any
  private output: string[] = []
  private outputLength: number = 0
  private error: string | null = null
  private executionTime: number = 0
  private maxExecutionTime: number = MAX_EXECUTION_TIME
  private startTime: number = 0
  private timeoutId: NodeJS.Timeout | null = null
  private isExecuting: boolean = false

  constructor() {
    // Создаем новое Lua состояние
    // luaL_newstate находится в lauxlib, а не в lua!
    this.L = lauxlib.luaL_newstate()
    
    // Загружаем базовые библиотеки (luaL_openlibs загружает все, включая os)
    // Но мы настроили webpack для игнорирования tmp модуля
    try {
      lualib.luaL_openlibs(this.L)
    } catch (e) {
      console.warn('Failed to load Lua libraries:', e)
    }
    
    // Настраиваем безопасную среду
    this.setupSandbox()
  }

  /**
   * Настройка песочницы - ограничиваем доступ к опасным функциям
   */
  private setupSandbox() {
    // Переопределяем print для захвата вывода с ограничениями
    const printFunc = (L: any) => {
      // Проверяем таймаут
      if (Date.now() - this.startTime > this.maxExecutionTime) {
        this.error = 'Execution timeout: Code took too long to execute'
        // Прерываем выполнение, выбрасывая ошибку
        throw new Error('Execution timeout')
      }

      const n = lua.lua_gettop(L)
      const args: string[] = []
      
      for (let i = 1; i <= n; i++) {
        // Ограничиваем количество аргументов
        if (i > 100) break
        
        const type = lua.lua_type(L, i)
        let value: string
        
        if (type === lua.LUA_TSTRING) {
          value = to_jsstring(lua.lua_tostring(L, i))
          // Ограничиваем длину строки
          if (value.length > 1000) {
            value = value.substring(0, 1000) + '... (truncated)'
          }
          args.push(value)
        } else if (type === lua.LUA_TNUMBER) {
          args.push(String(lua.lua_tonumber(L, i)))
        } else if (type === lua.LUA_TBOOLEAN) {
          args.push(lua.lua_toboolean(L, i) ? 'true' : 'false')
        } else if (type === lua.LUA_TNIL) {
          args.push('nil')
        } else {
          args.push(lua.lua_typename(L, type))
        }
      }
      
      const line = args.join('\t')
      
      // Проверяем ограничения вывода
      if (this.output.length >= MAX_OUTPUT_LINES) {
        this.error = `Output limit exceeded: Maximum ${MAX_OUTPUT_LINES} lines allowed`
        throw new Error('Output limit exceeded')
      }
      
      if (this.outputLength + line.length > MAX_OUTPUT_LENGTH) {
        this.error = `Output limit exceeded: Maximum ${MAX_OUTPUT_LENGTH} characters allowed`
        throw new Error('Output limit exceeded')
      }
      
      this.output.push(line)
      this.outputLength += line.length
      return 0
    }
    
    lua.lua_pushjsfunction(this.L, printFunc)
    lua.lua_setglobal(this.L, to_luastring('print'))

    // Удаляем опасные функции и модули
    const dangerousFunctions = [
      'dofile',
      'loadfile',
      'load',
      'loadstring',
      'require',
      'package',
      'io',
      'os',
      'debug',
      'getmetatable',
      'setmetatable',
      'rawget',
      'rawset',
      'rawequal',
      'rawlen',
      'collectgarbage',
    ]

    dangerousFunctions.forEach((func) => {
      lua.lua_pushnil(this.L)
      lua.lua_setglobal(this.L, to_luastring(func))
    })

    // Блокируем доступ к опасным модулям через package
    lua.lua_pushnil(this.L)
    lua.lua_setglobal(this.L, to_luastring('package'))
    
    // Ограничиваем доступ к глобальным переменным
    const restrictG = (L: any) => {
      this.error = 'Access to _G is restricted for security'
      throw new Error('Access to _G is restricted')
    }
    lua.lua_pushjsfunction(this.L, restrictG)
    lua.lua_setglobal(this.L, to_luastring('_G'))
  }

  /**
   * Выполнение Lua кода с защитой
   */
  execute(code: string): { output: string[]; error: string | null; executionTime: number } {
    // Сброс состояния
    this.output = []
    this.outputLength = 0
    this.error = null
    this.startTime = Date.now()
    this.isExecuting = true

    try {
      // Проверка размера кода
      if (code.length > MAX_CODE_SIZE) {
        this.error = `Code size limit exceeded: Maximum ${MAX_CODE_SIZE} characters allowed`
        this.executionTime = Date.now() - this.startTime
        return { output: [], error: this.error, executionTime: this.executionTime }
      }

      // Проверка на опасные паттерны в коде
      const dangerousPatterns = [
        /while\s+true\s+do/i,
        /for\s+.*\s+math\.huge/i,
        /require\s*\(/i,
        /dofile\s*\(/i,
        /loadfile\s*\(/i,
        /io\./i,
        /os\./i,
        /debug\./i,
        /package\./i,
      ]

      for (const pattern of dangerousPatterns) {
        if (pattern.test(code)) {
          this.error = 'Dangerous code pattern detected and blocked'
          this.executionTime = Date.now() - this.startTime
          return { output: [], error: this.error, executionTime: this.executionTime }
        }
      }

      // Загружаем код
      const status = lauxlib.luaL_loadstring(this.L, to_luastring(code))
      
      if (status !== lua.LUA_OK) {
        const errorMsg = to_jsstring(lua.lua_tostring(this.L, -1))
        lua.lua_pop(this.L, 1)
        this.error = `Syntax Error: ${errorMsg}`
        this.executionTime = Date.now() - this.startTime
        this.isExecuting = false
        return { output: [], error: this.error, executionTime: this.executionTime }
      }

      // Устанавливаем таймаут
      this.timeoutId = setTimeout(() => {
        if (this.isExecuting) {
          this.error = 'Execution timeout: Code took too long to execute'
          this.isExecuting = false
        }
      }, this.maxExecutionTime)

      try {
        // Защищенное выполнение с проверкой времени
        const checkTime = () => {
          if (Date.now() - this.startTime > this.maxExecutionTime) {
            this.error = 'Execution timeout: Code took too long to execute'
            return true
          }
          return false
        }

        // Выполняем код
        const execStatus = lua.lua_pcall(this.L, 0, lua.LUA_MULTRET, 0)
        
        if (this.timeoutId) {
          clearTimeout(this.timeoutId)
          this.timeoutId = null
        }

        this.isExecuting = false

        if (checkTime()) {
          this.executionTime = Date.now() - this.startTime
          return { output: [...this.output], error: this.error, executionTime: this.executionTime }
        }

        if (execStatus !== lua.LUA_OK) {
          const errorMsg = to_jsstring(lua.lua_tostring(this.L, -1))
          lua.lua_pop(this.L, 1)
          this.error = `Runtime Error: ${errorMsg}`
        }
      } catch (e: any) {
        if (this.timeoutId) {
          clearTimeout(this.timeoutId)
          this.timeoutId = null
        }
        this.isExecuting = false
        this.error = `Execution Error: ${e.message || String(e)}`
      }
    } catch (e: any) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
        this.timeoutId = null
      }
      this.isExecuting = false
      this.error = `Error: ${e.message || String(e)}`
    }

    this.executionTime = Date.now() - this.startTime

    return {
      output: [...this.output],
      error: this.error,
      executionTime: this.executionTime,
    }
  }

  /**
   * Очистка ресурсов
   */
  destroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    this.isExecuting = false
    if (this.L) {
      lua.lua_close(this.L)
    }
  }
}

/**
 * Создает новый экземпляр исполнителя Lua
 */
export function createLuaExecutor(): LuaExecutor {
  return new LuaExecutor()
}
