/**
 * Lua Step Executor - расширенный исполнитель с пошаговым выполнением
 * Позволяет выполнять код пошагово и отслеживать состояние переменных
 */

import './process-stub'
import fengari from 'fengari'

const { lua, lauxlib, lualib, to_jsstring, to_luastring } = fengari

// Расширяем типы для доступа к debug функциям, которых может не быть в d.ts
const luaAny = lua as any

// Константы безопасности
const MAX_CODE_SIZE = 50000
const MAX_OUTPUT_LINES = 1000
const MAX_OUTPUT_LENGTH = 100000
const MAX_EXECUTION_TIME = 2000
const MAX_STEPS = 10000 // Ограничение на количество шагов для предотвращения зависания

export interface VariableState {
  name: string
  value: string
  type: string
}

export interface ExecutionStep {
  step: number
  line?: number
  code?: string
  variables: VariableState[]
  output: string[]
  callStack: string[]
}

export class LuaStepExecutor {
  private L: any
  private output: string[] = []
  private outputLength: number = 0
  private error: string | null = null
  private executionTime: number = 0
  private maxExecutionTime: number = MAX_EXECUTION_TIME
  private startTime: number = 0
  private isExecuting: boolean = false
  private steps: ExecutionStep[] = []
  private currentStep: number = 0
  
  // Вспомогательные буферы для строк Lua
  private s_print: any
  private s_tostring: any
  
  constructor() {
    this.L = lauxlib.luaL_newstate()
    try {
      lualib.luaL_openlibs(this.L)
    } catch (e) {
      console.warn('Failed to load Lua libraries:', e)
    }
    
    this.s_print = to_luastring('print')
    this.s_tostring = to_luastring('tostring')
    
    this.setupSandbox()
  }

  private setupSandbox() {
    // Переопределяем print для захвата вывода
    const printFunc = (L: any) => {
      const n = lua.lua_gettop(L)
      const args: string[] = []
      
      for (let i = 1; i <= n; i++) {
        if (i > 100) break
        
        // Используем tostring для преобразования любого значения в строку
        luaAny.lua_getglobal(L, this.s_tostring)
        luaAny.lua_pushvalue(L, i)
        luaAny.lua_call(L, 1, 1)
        
        let value = ""
        if (luaAny.lua_isstring(L, -1)) {
          value = to_jsstring(lua.lua_tostring(L, -1))
        } else {
          // Fallback, если tostring вернул что-то странное (маловероятно)
          const type = lua.lua_type(L, -1)
          value = lua.lua_typename(L, type)
        }
        lua.lua_pop(L, 1) // Удаляем результат tostring

        if (value.length > 1000) {
          value = value.substring(0, 1000) + '... (truncated)'
        }
        args.push(value)
      }
      
      const line = args.join('\t')
      
      if (this.output.length >= MAX_OUTPUT_LINES) {
        // Не бросаем ошибку здесь, просто перестаем писать, чтобы не ломать логику шагов
        if (this.output.length === MAX_OUTPUT_LINES) {
           this.output.push("... (Output limit exceeded)")
        }
        return 0
      }
      
      this.output.push(line)
      this.outputLength += line.length
      return 0
    }
    
    lua.lua_pushjsfunction(this.L, printFunc)
    lua.lua_setglobal(this.L, this.s_print)

    // Удаляем опасные функции
    const dangerousFunctions = [
      'dofile', 'loadfile', 'load', 'loadstring', 'require', 'package',
      'io', 'os', 'debug', 'collectgarbage'
    ]

    dangerousFunctions.forEach((func) => {
      lua.lua_pushnil(this.L)
      lua.lua_setglobal(this.L, to_luastring(func))
    })
  }

  /**
   * Получает значение переменной на стеке как строку
   */
  private getValueAsString(index: number): string {
    const type = lua.lua_type(this.L, index)
    
    if (type === lua.LUA_TSTRING) {
      const val = lua.lua_tostring(this.L, index)
      return `"${(val as any) instanceof Uint8Array ? to_jsstring(val) : String(val)}"`
    } else if (type === lua.LUA_TNUMBER) {
      return String(lua.lua_tonumber(this.L, index))
    } else if (type === lua.LUA_TBOOLEAN) {
      return lua.lua_toboolean(this.L, index) ? 'true' : 'false'
    } else if (type === lua.LUA_TNIL) {
      return 'nil'
    } else if (type === luaAny.LUA_TTABLE) {
      // Для таблиц попробуем показать краткое содержимое
      // В хуке это безопасно делать аккуратно
      try {
        const len = luaAny.lua_rawlen(this.L, index)
        if (len > 0) {
           return `table[${len}]`
        }
        
        // Проверим, есть ли поля, не перебирая все (дорого)
        lua.lua_pushnil(this.L)
        if (luaAny.lua_next(this.L, index < 0 ? index - 1 : index) !== 0) {
            lua.lua_pop(this.L, 2)
            return `table {...}`
        }
        return `table: {}`
      } catch (e) {
        return `table`
      }
    } else if (type === luaAny.LUA_TFUNCTION) {
      return 'function'
    }
    
    const typeName = lua.lua_typename(this.L, type)
    return (typeName as any) instanceof Uint8Array ? to_jsstring(typeName) : String(typeName)
  }

  private getValueType(index: number): string {
    const type = lua.lua_type(this.L, index)
    const typeName = lua.lua_typename(this.L, type)
    return (typeName as any) instanceof Uint8Array ? to_jsstring(typeName) : String(typeName)
  }

  /**
   * Сбор информации о текущем шаге (стек, переменные)
   */
  private captureStep(L: any, ar: any) {
    if (this.steps.length >= MAX_STEPS) return;

    // 1. Получаем информацию о текущей строке
    luaAny.lua_getinfo(L, to_luastring('nSl'), ar)
    const currentLine = ar.currentline
    
    // Безопасное получение source
    let source = "<unknown>"
    if (ar.short_src) {
        // Проверяем, является ли это Uint8Array (в fengari строки это Uint8Array)
        if (ar.short_src instanceof Uint8Array) {
            source = to_jsstring(ar.short_src)
        } else if (typeof ar.short_src === 'string') {
            source = ar.short_src
        }
    }
    
    // Игнорируем шаги внутри самого fengari или служебного кода, если источник не совпадает
    
    if (currentLine <= 0) return

    // 2. Собираем Call Stack
    const callStack: string[] = []
    let level = 0
    const stackAr = new luaAny.lua_Debug()
    
    while (luaAny.lua_getstack(L, level, stackAr) === 1) {
      luaAny.lua_getinfo(L, to_luastring('nSl'), stackAr)
      
      let name = '<unknown>'
      if (stackAr.name) {
          if (stackAr.name instanceof Uint8Array) {
              name = to_jsstring(stackAr.name)
          } else if (typeof stackAr.name === 'string') {
              name = stackAr.name
          }
      }
      
      if (stackAr.what) {
          let what = ''
          if (stackAr.what instanceof Uint8Array) {
              what = to_jsstring(stackAr.what)
          } else if (typeof stackAr.what === 'string') {
              what = stackAr.what
          }
          
          if (what === 'main') name = '<main>'
      }
      
      callStack.push(name)
      level++
    }
    // Стек идет от вершины (текущая функция) вниз. Развернем для отображения <main> -> function
    callStack.reverse()

    // 3. Собираем Локальные переменные
    const vars: VariableState[] = []
    // Перебираем стек фреймов, чтобы найти переменные (можно только текущий уровень level 0)
    // Для отладки обычно важен текущий контекст
    let i = 1
    while (true) {
      const nameRef = luaAny.lua_getlocal(L, ar, i)
      if (!nameRef) break // Переменных больше нет
      
      let name = ''
      if (nameRef instanceof Uint8Array) {
          name = to_jsstring(nameRef)
      } else if (typeof nameRef === 'string') {
          name = nameRef
      } else {
          name = String(nameRef)
      }
      
      // Игнорируем служебные (временные) переменные Lua (начинаются с '(')
      if (!name.startsWith('(')) {
        vars.push({
          name: name,
          value: this.getValueAsString(-1),
          type: this.getValueType(-1)
        })
      }
      
      lua.lua_pop(L, 1) // Удаляем значение со стека
      i++
    }

    // Добавляем шаг
    this.steps.push({
      step: this.steps.length + 1,
      line: currentLine,
      variables: vars,
      output: [...this.output],
      callStack: callStack.length > 0 ? callStack : ['<main>']
    })
  }

  /**
   * Выполняет код пошагово с использованием хуков
   */
  executeStepByStep(code: string): { steps: ExecutionStep[]; error: string | null; executionTime: number } {
    this.output = []
    this.outputLength = 0
    this.error = null
    this.startTime = Date.now()
    this.isExecuting = true
    this.steps = []
    this.currentStep = 0
    
    try {
      if (code.length > MAX_CODE_SIZE) {
        throw new Error(`Code size limit exceeded`)
      }

      // Загружаем код
      const status = lauxlib.luaL_loadstring(this.L, to_luastring(code))
      if (status !== lua.LUA_OK) {
        const errorMsg = to_jsstring(lua.lua_tostring(this.L, -1))
        lua.lua_pop(this.L, 1)
        throw new Error(`Syntax Error: ${errorMsg}`)
      }

      // Устанавливаем Хук
      // Функция хука вызывается Lua. 
      // ar - это указатель на структуру активации (lua_Debug)
      const hookFunc = (L: any, ar: any) => {
        // Проверка таймаута
        if (Date.now() - this.startTime > this.maxExecutionTime) {
          luaAny.lua_sethook(L, null, 0, 0) // Убираем хук
          luaAny.lua_error(L) // Прерываем выполнение
          return
        }
        
        try {
          this.captureStep(L, ar)
        } catch (e) {
          console.error("Error in hook:", e)
        }
      }

      // LUA_MASKLINE = 1 << 2 (Вызывать хук на каждой новой строке кода)
      luaAny.lua_sethook(this.L, hookFunc, luaAny.LUA_MASKLINE, 0)

      // Запускаем выполнение
      const execStatus = lua.lua_pcall(this.L, 0, lua.LUA_MULTRET, 0)
      
      // Убираем хук после выполнения
      luaAny.lua_sethook(this.L, null, 0, 0)

      if (execStatus !== lua.LUA_OK) {
        let errorMsg = "Unknown runtime error"
        if (lua.lua_gettop(this.L) > 0) {
           errorMsg = to_jsstring(lua.lua_tostring(this.L, -1))
           lua.lua_pop(this.L, 1)
        }
        // Если ошибка была вызвана таймаутом (мы её бросили в хуке)
        if (Date.now() - this.startTime > this.maxExecutionTime) {
             this.error = "Execution timeout"
        } else {
             this.error = `Runtime Error: ${errorMsg}`
        }
      } else {
        // Добавляем финальный шаг "Конец выполнения"
        this.steps.push({
            step: this.steps.length + 1,
            line: undefined, // Нет конкретной строки
            variables: [],
            output: [...this.output],
            callStack: []
        })
      }

    } catch (e: any) {
      this.error = e.message || String(e)
    }

    this.executionTime = Date.now() - this.startTime
    return {
      steps: this.steps,
      error: this.error,
      executionTime: this.executionTime
    }
  }

  /**
   * Обычное выполнение без хуков
   */
  execute(code: string): { output: string[]; error: string | null; executionTime: number } {
    this.output = []
    this.outputLength = 0
    this.error = null
    this.startTime = Date.now()

    try {
      const status = lauxlib.luaL_loadstring(this.L, to_luastring(code))
      if (status !== lua.LUA_OK) {
        const errorMsg = to_jsstring(lua.lua_tostring(this.L, -1))
        lua.lua_pop(this.L, 1)
        throw new Error(`Syntax Error: ${errorMsg}`)
      }

      const execStatus = lua.lua_pcall(this.L, 0, lua.LUA_MULTRET, 0)
      if (execStatus !== lua.LUA_OK) {
        const errorMsg = to_jsstring(lua.lua_tostring(this.L, -1))
        lua.lua_pop(this.L, 1)
        throw new Error(`Runtime Error: ${errorMsg}`)
      }
    } catch (e: any) {
      this.error = e.message || String(e)
    }

    return {
      output: this.output,
      error: this.error,
      executionTime: Date.now() - this.startTime
    }
  }

  destroy() {
    if (this.L) {
      lua.lua_close(this.L)
    }
  }
}

export function createLuaStepExecutor(): LuaStepExecutor {
  return new LuaStepExecutor()
}
