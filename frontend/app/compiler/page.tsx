"use client"

import { StudentNav } from "@/components/student/student-nav"
import { LuaVisualizer } from "@/components/compiler/lua-visualizer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Code2, Play, StepForward } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAppSelector } from "@/lib/hooks"
import { useGetMeQuery } from "@/lib/api/authSlice"

export default function CompilerPage() {
  const router = useRouter()
  const { user, isAuthenticated, token } = useAppSelector((state) => state.auth)
  const [isClient, setIsClient] = useState(false)
  
  const { isLoading: meLoading } = useGetMeQuery(undefined, {
    skip: isAuthenticated,
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      if (meLoading) {
        return
      }
      
      if (!token && !isAuthenticated && !meLoading) {
        router.push('/login')
      }
    }
  }, [isClient, isAuthenticated, token, meLoading, router])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StudentNav />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-6 max-w-7xl">
        {/* Заголовок */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Lua Компилятор</h1>
              <p className="text-muted-foreground">
                Пошаговая визуализация выполнения Lua кода
              </p>
            </div>
          </div>
        </div>

        {/* Описание */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Как использовать
            </CardTitle>
            <CardDescription>
              Визуализатор позволяет выполнять Lua код пошагово и видеть состояние переменных на каждом шаге
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <StepForward className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <strong>Пошагово:</strong> Выполняет код пошагово с визуализацией каждой инструкции
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Play className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <strong>Запустить:</strong> Выполняет весь код сразу и показывает результат
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Code2 className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <strong>Переменные:</strong> Показывает все переменные и их значения на текущем шаге
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link href="/compiler/test" className="block">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  🧪 Запустить тесты компилятора
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Визуализатор */}
        <Card className="min-h-[600px]">
          <CardContent className="p-6">
            <LuaVisualizer 
              initialCode={`-- Пример кода
local message = "Привет, Roblox!"
print(message)
message = "Я учусь Lua!"
print(message)

local x = 10
local y = 20
local sum = x + y
print("Сумма: " .. sum)`}
              height="600px"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

