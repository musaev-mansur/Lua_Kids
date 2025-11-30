"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { runAllTests, type TestResult } from "@/lib/lua-test"
import { runAllStressTests, type StressTestResult } from "@/lib/lua-stress-test"
import { runAllStressTestsAsync } from "@/lib/lua-stress-test-async"
import { CheckCircle, XCircle, Play, Loader2, AlertTriangle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TestLuaPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [allPassed, setAllPassed] = useState(false)
  const [stressResults, setStressResults] = useState<StressTestResult[] | null>(null)
  const [stressAllPassed, setStressAllPassed] = useState(false)
  const [isRunningStress, setIsRunningStress] = useState(false)

  const handleRunTests = () => {
    setIsRunning(true)
    setResults(null)
    
    // Запускаем тесты в следующем тике, чтобы UI обновился
    setTimeout(() => {
      try {
        const testResults = runAllTests()
        setResults(testResults.results)
        setAllPassed(testResults.allPassed)
      } catch (error: any) {
        console.error("Ошибка при запуске тестов:", error)
        setResults([{
          name: "Ошибка запуска тестов",
          passed: false,
          error: error.message || String(error)
        }])
        setAllPassed(false)
      } finally {
        setIsRunning(false)
      }
    }, 100)
  }

  const [stressProgress, setStressProgress] = useState<{ current: number; total: number; testName: string } | null>(null)

  const handleRunStressTests = async () => {
    setIsRunningStress(true)
    setStressResults(null)
    setStressProgress(null)
    
    try {
      const testResults = await runAllStressTestsAsync((current, total, testName) => {
        setStressProgress({ current, total, testName })
      })
      setStressResults(testResults.results)
      setStressAllPassed(testResults.allPassed)
    } catch (error: any) {
      console.error("Ошибка при запуске стресс-тестов:", error)
      setStressResults([{
        name: "Ошибка запуска стресс-тестов",
        passed: false,
        error: error.message || String(error),
        expectedBehavior: "Тесты должны запуститься"
      }])
      setStressAllPassed(false)
    } finally {
      setIsRunningStress(false)
      setStressProgress(null)
    }
  }

  const renderTestResults = (testResults: TestResult[], allPassed: boolean) => (
    <div className="space-y-4">
      <Alert className={allPassed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
        <div className="flex items-center gap-2">
          {allPassed ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <AlertDescription className="font-semibold">
            {allPassed
              ? `Все тесты пройдены! (${testResults.filter(r => r.passed).length}/${testResults.length})`
              : `Провалено тестов: ${testResults.filter(r => !r.passed).length} из ${testResults.length}`}
          </AlertDescription>
        </div>
      </Alert>

      <div className="grid gap-4">
        {testResults.map((result, index) => (
          <Card key={index} className={result.passed ? "border-green-200" : "border-red-200"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {result.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  {result.name}
                </CardTitle>
                <Badge variant={result.passed ? "default" : "destructive"}>
                  {result.passed ? "PASS" : "FAIL"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {result.error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>
                    <strong>Ошибка:</strong> {result.error}
                  </AlertDescription>
                </Alert>
              )}
              {result.output && result.output.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Вывод:</p>
                  <div className="bg-muted p-3 rounded-lg font-mono text-xs max-h-40 overflow-y-auto">
                    {result.output.slice(0, 10).map((line: string, i: number) => (
                      <div key={i}>{line}</div>
                    ))}
                    {result.output.length > 10 && (
                      <div className="text-muted-foreground mt-2">
                        ... и еще {result.output.length - 10} строк
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderStressTestResults = (testResults: StressTestResult[], allPassed: boolean) => (
    <div className="space-y-4">
      <Alert className={allPassed ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
        <div className="flex items-center gap-2">
          {allPassed ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          )}
          <AlertDescription className="font-semibold">
            {allPassed
              ? `Все стресс-тесты пройдены! (${testResults.filter(r => r.passed).length}/${testResults.length})`
              : `Провалено тестов: ${testResults.filter(r => !r.passed).length} из ${testResults.length}`}
          </AlertDescription>
        </div>
      </Alert>

      <div className="grid gap-4">
        {testResults.map((result, index) => (
          <Card key={index} className={result.passed ? "border-green-200" : "border-yellow-200"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {result.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                  {result.name}
                </CardTitle>
                <Badge variant={result.passed ? "default" : "secondary"}>
                  {result.passed ? "PASS" : "FAIL"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Ожидаемое поведение:</strong> {result.expectedBehavior}
              </p>
              {result.executionTime !== undefined && (
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Время выполнения:</strong> {result.executionTime}ms
                </p>
              )}
              {result.error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>
                    <strong>Ошибка:</strong> {result.error}
                  </AlertDescription>
                </Alert>
              )}
              {result.output && result.output.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Вывод:</p>
                  <div className="bg-muted p-3 rounded-lg font-mono text-xs max-h-40 overflow-y-auto">
                    {result.output.slice(0, 10).map((line: string, i: number) => (
                      <div key={i}>{line}</div>
                    ))}
                    {result.output.length > 10 && (
                      <div className="text-muted-foreground mt-2">
                        ... и еще {result.output.length - 10} строк
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">Тестирование Lua Executor</CardTitle>
            <CardDescription>
              Комплексная проверка поддержки всех основных конструкций языка Lua и устойчивости к нагрузкам
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Базовые тесты</TabsTrigger>
            <TabsTrigger value="stress">Стресс-тесты</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleRunTests}
                  disabled={isRunning}
                  size="lg"
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Запуск тестов...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Запустить базовые тесты
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {results && renderTestResults(results, allPassed)}
          </TabsContent>

          <TabsContent value="stress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Стресс-тестирование
                </CardTitle>
                <CardDescription>
                  Тесты на устойчивость: бесконечные циклы, сложные алгоритмы, проверка безопасности
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleRunStressTests}
                  disabled={isRunningStress}
                  size="lg"
                  className="w-full"
                  variant="destructive"
                >
                  {isRunningStress ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Запуск стресс-тестов...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Запустить стресс-тесты
                    </>
                  )}
                </Button>
                {stressProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Тест {stressProgress.current} из {stressProgress.total}
                      </span>
                      <span className="font-medium">
                        {Math.round((stressProgress.current / stressProgress.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(stressProgress.current / stressProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stressProgress.testName}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {stressResults && renderStressTestResults(stressResults, stressAllPassed)}
          </TabsContent>
        </Tabs>

        {results && (
          <div className="space-y-4">
            <Alert className={allPassed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              <div className="flex items-center gap-2">
                {allPassed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <AlertDescription className="font-semibold">
                  {allPassed
                    ? `Все тесты пройдены! (${results.filter(r => r.passed).length}/${results.length})`
                    : `Провалено тестов: ${results.filter(r => !r.passed).length} из ${results.length}`}
                </AlertDescription>
              </div>
            </Alert>

            <div className="grid gap-4">
              {results.map((result, index) => (
                <Card key={index} className={result.passed ? "border-green-200" : "border-red-200"}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {result.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        {result.name}
                      </CardTitle>
                      <Badge variant={result.passed ? "default" : "destructive"}>
                        {result.passed ? "PASS" : "FAIL"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {result.error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertDescription>
                          <strong>Ошибка:</strong> {result.error}
                        </AlertDescription>
                      </Alert>
                    )}
                    {result.output && result.output.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Вывод:</p>
                        <div className="bg-muted p-3 rounded-lg font-mono text-xs max-h-40 overflow-y-auto">
                          {result.output.slice(0, 10).map((line: string, i: number) => (
                            <div key={i}>{line}</div>
                          ))}
                          {result.output.length > 10 && (
                            <div className="text-muted-foreground mt-2">
                              ... и еще {result.output.length - 10} строк
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Что тестируется:</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Базовые операции и переменные</li>
              <li>Строки и строковые операции</li>
              <li>Таблицы (массивы и объекты)</li>
              <li>Функции (обычные, анонимные, высшего порядка)</li>
              <li>Ветвления (if/else/elseif)</li>
              <li>Циклы for (числовые, ipairs, pairs)</li>
              <li>Циклы while и repeat-until</li>
              <li>Математические функции</li>
              <li>Функции работы с таблицами</li>
              <li>Рекурсия</li>
              <li>Замыкания</li>
              <li>Комплексные комбинации всех конструкций</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

