"use client"

// Загружаем заглушку для process.binding перед импортом fengari
import "@/lib/process-stub"

import { useEffect, useRef, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Play, RefreshCw, Loader2 } from "lucide-react"
import { createLuaExecutor, LuaExecutor } from "@/lib/lua-executor"

// Динамический импорт Monaco Editor для уменьшения размера бандла
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
})

interface LuaEditorProps {
  initialCode: string
  onRun: (code: string, output: string[], error: string | null) => Promise<void>
  isRunning: boolean
  height?: string
  lessonId?: string
  onCodeChange?: (code: string) => void
}

export function LuaEditor({ initialCode, onRun, isRunning, height = "500px", lessonId, onCodeChange }: LuaEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [editorReady, setEditorReady] = useState(false)
  const executorRef = useRef<LuaExecutor | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Функция для сохранения кода в localStorage
  const saveCodeToStorage = useCallback((codeToSave: string) => {
    if (lessonId && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`lesson_code_${lessonId}`, codeToSave)
      } catch (error) {
        console.error('Failed to save code to localStorage:', error)
      }
    }
    // Вызываем callback, если он передан
    if (onCodeChange) {
      onCodeChange(codeToSave)
    }
  }, [lessonId, onCodeChange])

  // Загрузка сохраненного кода при монтировании
  useEffect(() => {
    if (lessonId && typeof window !== 'undefined') {
      try {
        const savedCode = localStorage.getItem(`lesson_code_${lessonId}`)
        if (savedCode && savedCode.trim() !== '') {
          setCode(savedCode)
        }
      } catch (error) {
        console.error('Failed to load code from localStorage:', error)
      }
    }
  }, [lessonId])

  // Инициализация Lua исполнителя
  useEffect(() => {
    try {
      executorRef.current = createLuaExecutor()
      setEditorReady(true)
    } catch (error) {
      console.error("Failed to initialize Lua executor:", error)
    }

    return () => {
      if (executorRef.current) {
        executorRef.current.destroy()
      }
      // Очищаем таймер при размонтировании
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Сброс кода при изменении initialCode (только если нет сохраненного кода)
  useEffect(() => {
    if (lessonId && typeof window !== 'undefined') {
      const savedCode = localStorage.getItem(`lesson_code_${lessonId}`)
      if (!savedCode || savedCode.trim() === '') {
        setCode(initialCode)
      }
    } else {
      setCode(initialCode)
    }
  }, [initialCode, lessonId])

  const handleRun = async () => {
    if (!executorRef.current || isRunning) return

    try {
      const result = executorRef.current.execute(code)
      // Сохраняем код после успешного выполнения
      saveCodeToStorage(code)
      await onRun(code, result.output, result.error)
    } catch (error: any) {
      // Сохраняем код даже при ошибке выполнения
      saveCodeToStorage(code)
      await onRun(code, [], `Execution Error: ${error.message || String(error)}`)
    }
  }

  const handleReset = () => {
    setCode(initialCode)
    // Очищаем сохраненный код при сбросе
    if (lessonId && typeof window !== 'undefined') {
      localStorage.removeItem(`lesson_code_${lessonId}`)
    }
  }

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || ""
    setCode(newCode)
    
    // Сохраняем код с debounce (через 500ms после последнего изменения)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveCodeToStorage(newCode)
    }, 500)
  }

  const handleEditorMount = (editor: any, monaco: any) => {
    // Настройка Monaco Editor для Lua
    monaco.languages.register({ id: "lua" })
    
    monaco.languages.setMonarchTokensProvider("lua", {
      tokenizer: {
        root: [
          // Ключевые слова Lua
          [
            /(and|break|do|else|elseif|end|false|for|function|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/,
            "keyword",
          ],
          // Строки
          [/"([^"\\]|\\.)*"/, "string"],
          [/'([^'\\]|\\.)*'/, "string"],
          // Комментарии
          [/--.*$/, "comment"],
          [/--\[\[[\s\S]*?\]\]/, "comment"],
          // Числа
          [/\d+\.?\d*/, "number"],
          // Операторы
          [/[+\-*/%=<>!&|]+/, "operator"],
          // Идентификаторы
          [/[a-z_$][a-z0-9_$]*/i, "identifier"],
        ],
      },
    })

    // Тема для редактора
    monaco.editor.defineTheme("lua-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "569cd6" },
        { token: "string", foreground: "ce9178" },
        { token: "comment", foreground: "6a9955" },
        { token: "number", foreground: "b5cea8" },
        { token: "operator", foreground: "d4d4d4" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
      },
    })

    monaco.editor.setTheme("lua-dark")
  }

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-[#1e1e1e]">
      {/* Заголовок редактора */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42]">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-blue-400">script.lua</div>
          {!editorReady && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleReset}
            disabled={isRunning}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Reset
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
            onClick={handleRun}
            disabled={isRunning || !editorReady}
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="mr-1 h-3 w-3" />
                Run Script
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1" style={{ height }}>
        {editorReady ? (
          <MonacoEditor
            language="lua"
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            theme="lua-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: "on",
              fontFamily: "'Fira Code', 'Courier New', monospace",
              fontLigatures: true,
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  )
}

