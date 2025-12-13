"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Play } from "lucide-react"
import { StudentNav } from "@/components/student/student-nav"

export default function CompilerTestPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [testCases, setTestCases] = useState<any[]>([])
  const [results, setResults] = useState<{
    passed: number
    failed: number
    results: Array<{
      name: string
      passed: boolean
      error?: string
      output?: string[]
      expectedOutput?: string[]
    }>
  } | null>(null)

  // Динамически загружаем тесты только на клиенте
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/lib/lua-executor-tests').then((module) => {
        setTestCases(module.testCases)
      }).catch((error) => {
        console.error('Failed to load tests:', error)
      })
    }
  }, [])

  const handleRunTests = async () => {
    if (typeof window === 'undefined') return
    
    setIsRunning(true)
    try {
      const { runAllTests } = await import('@/lib/lua-executor-tests')
      const testResults = await runAllTests()
      setResults(testResults)
    } catch (error) {
      console.error('Test execution error:', error)
      setResults({
        passed: 0,
        failed: 0,
        results: [{
          name: 'Ошибка загрузки',
          passed: false,
          error: error instanceof Error ? error.message : String(error),
        }]
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StudentNav />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-6 max-w-7xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Тесты компилятора Lua</h1>
          <p className="text-muted-foreground">
            Проверка работы компилятора с различными конструкциями Lua
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Тестовые случаи</CardTitle>
              <Button
                onClick={handleRunTests}
                disabled={isRunning}
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Выполнение тестов...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Запустить все тесты
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {results && (
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-semibold">Пройдено: {results.passed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-semibold">Провалено: {results.failed}</span>
                  </div>
                  <Badge variant={results.failed === 0 ? "default" : "destructive"}>
                    {results.passed} / {results.passed + results.failed}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {testCases.length === 0 && !isRunning && (
                <div className="text-center py-8 text-muted-foreground">
                  Загрузка тестов...
                </div>
              )}
              {testCases.map((testCase, index) => {
                const result = results?.results[index]
                return (
                  <Card key={index} className={result ? (result.passed ? "border-green-500" : "border-red-500") : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {result && (
                            result.passed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )
                          )}
                          {testCase.name}
                        </CardTitle>
                        {result && (
                          <Badge variant={result.passed ? "default" : "destructive"}>
                            {result.passed ? "Пройден" : "Провален"}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">{testCase.description}</p>
                        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                          <code>{testCase.code}</code>
                        </pre>
                      </div>

                      {result && (
                        <div className="space-y-2">
                          {result.error && (
                            <div className="p-2 bg-red-500/10 border border-red-500 rounded text-sm text-red-600 dark:text-red-400">
                              <strong>Ошибка:</strong> {result.error}
                            </div>
                          )}

                          {result.output && (
                            <div>
                              <p className="text-sm font-semibold mb-1">Вывод:</p>
                              <div className="bg-muted p-2 rounded text-xs font-mono">
                                {result.output.length > 0 ? (
                                  result.output.map((line, i) => (
                                    <div key={i}>{line}</div>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground">(нет вывода)</span>
                                )}
                              </div>
                            </div>
                          )}

                          {testCase.expectedOutput && result.output && (
                            <div>
                              <p className="text-sm font-semibold mb-1">Ожидаемый вывод:</p>
                              <div className="bg-muted p-2 rounded text-xs font-mono">
                                {testCase.expectedOutput.map((line: string, i: number) => (
                                  <div key={i}>{line}</div>
                                ))}
                              </div>
                              {JSON.stringify(result.output) !== JSON.stringify(testCase.expectedOutput) && (
                                <p className="text-xs text-red-500 mt-1">
                                  Вывод не совпадает с ожидаемым!
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

