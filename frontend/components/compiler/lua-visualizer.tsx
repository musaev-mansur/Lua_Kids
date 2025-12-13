"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, StepForward, StepBack, RotateCcw, Loader2, ChevronRight, ArrowRight } from "lucide-react"
import { createLuaStepExecutor, LuaStepExecutor, ExecutionStep, VariableState } from "@/lib/lua-step-executor"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
})

interface LuaVisualizerProps {
  initialCode?: string
  height?: string
}

export function LuaVisualizer({ 
  initialCode = "-- Напишите Lua код здесь\nlocal message = \"Привет, Roblox!\"\nprint(message)\nmessage = \"Я учусь Lua!\"\nprint(message)", 
  height = "600px" 
}: LuaVisualizerProps) {
  const [code, setCode] = useState(initialCode)
  const [editorReady, setEditorReady] = useState(false)
  const executorRef = useRef<LuaStepExecutor | null>(null)
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const decorationsRef = useRef<string[]>([])
  
  const [steps, setSteps] = useState<ExecutionStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [executionTime, setExecutionTime] = useState(0)

  // Инициализация исполнителя
  useEffect(() => {
    try {
      executorRef.current = createLuaStepExecutor()
      setEditorReady(true)
    } catch (error) {
      console.error("Failed to initialize Lua step executor:", error)
    }

    return () => {
      if (executorRef.current) {
        executorRef.current.destroy()
      }
    }
  }, [])

  // Обновление подсветки строк при изменении шага
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) {
      return
    }

    if (currentStepIndex < 0 || steps.length === 0) {
      // Убираем все подсветки
      if (decorationsRef.current.length > 0) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [])
      }
      return
    }

    try {
      const currentStep = steps[currentStepIndex]
      const nextStep = currentStepIndex < steps.length - 1 ? steps[currentStepIndex + 1] : null
      
      const decorations: any[] = []
      const { Range } = monacoRef.current
      
      // Зеленая стрелка для выполненной строки
      if (currentStep.line && currentStep.line > 0) {
        const lineNum = currentStep.line
        decorations.push({
          range: new Range(lineNum, 1, lineNum, 1),
          options: {
            isWholeLine: true,
            inlineClassName: 'executed-line-bg',
            glyphMarginClassName: 'executed-line-arrow',
            glyphMarginHoverMessage: { value: '➡ line that just executed' },
            minimap: { color: '#22c55e', position: 1 },
            overviewRuler: { color: '#22c55e', position: 1 },
            stickiness: 1,
          }
        })
      }
      
      // Красная стрелка для следующей строки
      if (nextStep && nextStep.line && nextStep.line > 0) {
        const lineNum = nextStep.line
        decorations.push({
          range: new Range(lineNum, 1, lineNum, 1),
          options: {
            isWholeLine: true,
            inlineClassName: 'next-line-bg',
            glyphMarginClassName: 'next-line-arrow',
            glyphMarginHoverMessage: { value: '➡ next line to execute' },
            minimap: { color: '#ef4444', position: 1 },
            overviewRuler: { color: '#ef4444', position: 1 },
            stickiness: 1,
          }
        })
      }

      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, decorations)
      
    } catch (error) {
      console.error('Error updating decorations:', error)
    }
  }, [currentStepIndex, steps])

  const handleCodeChange = useCallback((value: string | undefined) => {
    setCode(value || '')
    // Сбрасываем шаги при изменении кода
    if (steps.length > 0) {
      setSteps([])
      setCurrentStepIndex(-1)
    }
  }, [steps.length])

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco
    
    // Настройка Monaco для Lua
    monaco.languages.register({ id: "lua" })
    
    monaco.languages.setMonarchTokensProvider("lua", {
      tokenizer: {
        root: [
          [/(and|break|do|else|elseif|end|false|for|function|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/, "keyword"],
          [/"([^"\\]|\\.)*"/, "string"],
          [/'([^'\\]|\\.)*'/, "string"],
          [/--.*$/, "comment"],
          [/--\[\[[\s\S]*?\]\]/, "comment"],
          [/\d+\.?\d*/, "number"],
          [/[+\-*/%=<>!&|]+/, "operator"],
          [/[a-z_$][a-z0-9_$]*/i, "identifier"],
        ],
      },
    })

    // Добавляем стили для стрелок и подсветки строк
    if (!document.getElementById('monaco-arrow-styles')) {
      const style = document.createElement('style')
      style.id = 'monaco-arrow-styles'
      style.textContent = `
        /* Подсветка фона строк */
        .monaco-editor .view-line .executed-line-bg {
          background-color: rgba(34, 197, 94, 0.2) !important;
        }
        .monaco-editor .view-line .next-line-bg {
          background-color: rgba(239, 68, 68, 0.2) !important;
        }
        
        /* Стрелки в glyph margin - используем правильный селектор */
        .monaco-editor .margin .executed-line-arrow,
        .monaco-editor .glyph-margin .executed-line-arrow {
          background-color: transparent !important;
          color: #22c55e !important;
          font-size: 16px !important;
          line-height: 20px !important;
          text-align: center !important;
          width: 20px !important;
          display: inline-block !important;
        }
        .monaco-editor .margin .executed-line-arrow::before,
        .monaco-editor .glyph-margin .executed-line-arrow::before {
          content: '➡' !important;
          color: #22c55e !important;
          font-size: 16px !important;
          display: inline-block !important;
          line-height: 20px !important;
        }
        
        .monaco-editor .margin .next-line-arrow,
        .monaco-editor .glyph-margin .next-line-arrow {
          background-color: transparent !important;
          color: #ef4444 !important;
          font-size: 16px !important;
          line-height: 20px !important;
          text-align: center !important;
          width: 20px !important;
          display: inline-block !important;
        }
        .monaco-editor .margin .next-line-arrow::before,
        .monaco-editor .glyph-margin .next-line-arrow::before {
          content: '➡' !important;
          color: #ef4444 !important;
          font-size: 16px !important;
          display: inline-block !important;
          line-height: 20px !important;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  const handleRun = useCallback(() => {
    if (!executorRef.current || !code.trim()) return

    setIsExecuting(true)
    setError(null)
    setSteps([])
    setCurrentStepIndex(-1)

    try {
      const result = executorRef.current.execute(code)
      setExecutionTime(result.executionTime)
      
      if (result.error) {
        setError(result.error)
      } else {
        const finalStep: ExecutionStep = {
          step: 0,
          variables: [],
          output: result.output,
          callStack: ['<main>'],
        }
        setSteps([finalStep])
        setCurrentStepIndex(0)
      }
    } catch (e: any) {
      setError(`Error: ${e.message || String(e)}`)
    } finally {
      setIsExecuting(false)
    }
  }, [code])

  const handleStepByStep = useCallback(() => {
    if (!executorRef.current || !code.trim()) return

    setIsExecuting(true)
    setError(null)
    setSteps([])
    setCurrentStepIndex(-1)

    try {
      const result = executorRef.current.executeStepByStep(code)
      setExecutionTime(result.executionTime)
      
      if (result.error) {
        setError(result.error)
      } else {
        setSteps(result.steps)
        if (result.steps.length > 0) {
          setCurrentStepIndex(0)
        }
      }
    } catch (e: any) {
      setError(`Error: ${e.message || String(e)}`)
    } finally {
      setIsExecuting(false)
    }
  }, [code])

  const handleNextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }, [currentStepIndex, steps.length])

  const handlePrevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }, [currentStepIndex])

  const handleFirstStep = useCallback(() => {
    if (steps.length > 0) {
      setCurrentStepIndex(0)
    }
  }, [steps.length])

  const handleLastStep = useCallback(() => {
    if (steps.length > 0) {
      setCurrentStepIndex(steps.length - 1)
    }
  }, [steps.length])

  const handleSliderChange = useCallback((value: number[]) => {
    const newIndex = value[0]
    if (newIndex >= 0 && newIndex < steps.length) {
      setCurrentStepIndex(newIndex)
    }
  }, [steps.length])

  const handleReset = useCallback(() => {
    setSteps([])
    setCurrentStepIndex(-1)
    setError(null)
    setExecutionTime(0)
    if (editorRef.current && decorationsRef.current.length > 0) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [])
    }
  }, [])

  const currentStep = currentStepIndex >= 0 && currentStepIndex < steps.length 
    ? steps[currentStepIndex] 
    : null

  const getOutputForStep = (step: ExecutionStep, stepIndex: number): string[] => {
    if (stepIndex === 0) {
      return step.output
    }
    const prevStep = steps[stepIndex - 1]
    const newOutput: string[] = []
    for (let i = prevStep.output.length; i < step.output.length; i++) {
      newOutput.push(step.output[i])
    }
    return newOutput
  }

  const getAccumulatedOutput = (stepIndex: number): string[] => {
    if (stepIndex < 0 || stepIndex >= steps.length) return []
    return steps[stepIndex].output
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Панель управления */}
      <div className="flex items-center justify-between gap-2 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleStepByStep}
            disabled={isExecuting || !code.trim()}
            variant="default"
            size="sm"
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Выполнение...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Пошагово
              </>
            )}
          </Button>
          <Button
            onClick={handleRun}
            disabled={isExecuting || !code.trim()}
            variant="outline"
            size="sm"
          >
            <Play className="mr-2 h-4 w-4" />
            Запустить
          </Button>
          <Button
            onClick={handleReset}
            disabled={steps.length === 0}
            variant="ghost"
            size="sm"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Сброс
          </Button>
        </div>
        {steps.length > 0 && (
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Button
              onClick={handleFirstStep}
              disabled={currentStepIndex <= 0}
              variant="outline"
              size="sm"
            >
              &lt;&lt; First
            </Button>
            <Button
              onClick={handlePrevStep}
              disabled={currentStepIndex <= 0}
              variant="outline"
              size="sm"
            >
              &lt; Prev
            </Button>
            <Slider
              value={[currentStepIndex]}
              min={0}
              max={Math.max(0, steps.length - 1)}
              step={1}
              onValueChange={handleSliderChange}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground min-w-[60px] text-center">
              {currentStepIndex + 1} / {steps.length}
            </span>
            <Button
              onClick={handleNextStep}
              disabled={currentStepIndex >= steps.length - 1}
              variant="outline"
              size="sm"
            >
              Next &gt;
            </Button>
            <Button
              onClick={handleLastStep}
              disabled={currentStepIndex >= steps.length - 1}
              variant="outline"
              size="sm"
            >
              Last &gt;&gt;
            </Button>
          </div>
        )}
        {executionTime > 0 && (
          <span className="text-xs text-muted-foreground">
            {executionTime}ms
          </span>
        )}
      </div>

      {/* Легенда */}
      {steps.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-4">
          <div className="flex items-center gap-2">
            <span className="text-green-500">➡</span>
            <span>line that just executed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500">➡</span>
            <span>next line to execute</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Редактор кода */}
        <div className="lg:col-span-1 flex flex-col" style={{ height }}>
          <div className="mb-2">
            <h3 className="text-sm font-semibold">Код</h3>
          </div>
          <div className="flex-1 border rounded-lg overflow-hidden">
            {editorReady ? (
              <MonacoEditor
                language="lua"
                value={code}
                onChange={handleCodeChange}
                onMount={handleEditorMount}
                theme="vs-dark"
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
                  glyphMargin: true,
                  lineDecorationsWidth: 20,
                  lineNumbersMinChars: 3,
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Визуализация */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Print Output */}
          <Card className="h-[250px] min-h-[150px] resize-y overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Print output (drag lower right corner to resize)</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 bg-muted/30">
              <ScrollArea className="h-full">
                {error ? (
                  <div className="text-destructive font-mono text-sm whitespace-pre-wrap p-2">
                    {error}
                  </div>
                ) : currentStep ? (
                  <div className="space-y-1 p-2">
                    {getAccumulatedOutput(currentStepIndex).map((line, idx) => (
                      <div key={idx} className="font-mono text-sm text-foreground">
                        {line}
                      </div>
                    ))}
                    {getAccumulatedOutput(currentStepIndex).length === 0 && (
                      <div className="text-muted-foreground text-sm italic">
                        (нет вывода)
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm italic p-2">
                    Нажмите "Пошагово" или "Запустить" для выполнения кода
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Frames and Objects */}
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-[350px]">
            {/* Frames */}
            <Card className="flex flex-col min-h-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Frames</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  {currentStep && currentStep.callStack.length > 0 ? (
                    <div className="space-y-2">
                      {currentStep.callStack.map((frame, idx) => (
                        <div key={idx} className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded border border-blue-300 dark:border-blue-700">
                          <div className="font-semibold text-sm mb-2">{frame}</div>
                          {currentStep.variables.filter(v => v.name).map((variable, vIdx) => (
                            <div key={vIdx} className="flex items-center gap-2 text-sm mb-1">
                              <span className="font-mono font-semibold">{variable.name}</span>
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono text-xs">{variable.value}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm italic">
                      Нет фреймов
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Objects */}
            <Card className="flex flex-col min-h-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Objects</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  {currentStep && currentStep.variables.length > 0 ? (
                    <div className="space-y-2">
                      {currentStep.variables.map((variable, idx) => {
                        // Определяем тип объекта для визуализации
                        const isList = variable.type === 'table' || variable.value.includes(',')
                        const isString = variable.type === 'string'
                        const isNumber = variable.type === 'number'
                        
                        return (
                          <div key={idx} className="relative">
                            {isList ? (
                              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded border border-yellow-300 dark:border-yellow-700">
                                <div className="font-semibold text-sm mb-2">list</div>
                                <div className="grid grid-cols-3 gap-1">
                                  {variable.value.split(',').map((item, itemIdx) => (
                                    <div key={itemIdx} className="bg-yellow-200 dark:bg-yellow-800/50 p-2 rounded text-xs text-center border border-yellow-400 dark:border-yellow-600 overflow-hidden">
                                      <div className="text-xs text-muted-foreground mb-1">{itemIdx}</div>
                                      <div className="font-mono break-all line-clamp-2" title={item.trim()}>{item.trim()}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className={`p-3 rounded border ${
                                isString ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' :
                                isNumber ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' :
                                'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                              }`}>
                                <div className="font-semibold text-sm mb-1">{variable.type}</div>
                                <div className="font-mono text-sm">{variable.value}</div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm italic">
                      Нет объектов
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
