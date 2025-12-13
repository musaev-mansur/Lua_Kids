"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLoginMutation } from "@/lib/api/authSlice"
import { useAppDispatch } from "@/lib/hooks"
import { setCredentials } from "@/lib/api/authSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [login, { isLoading, error }] = useLoginMutation()
  
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (error) {
      if ('data' in error && typeof error.data === 'object' && error.data !== null) {
        const errorData = error.data as any
        setErrorMessage(errorData.error || 'Ошибка входа')
      } else {
        setErrorMessage('Ошибка подключения к серверу')
      }
    }
  }, [error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    try {
      const result = await login({ username, password }).unwrap()
      dispatch(setCredentials({ user: result.user, token: result.token }))
      router.push("/")
    } catch (err: any) {
      if (err.data?.error) {
        setErrorMessage(err.data.error)
      } else {
        setErrorMessage('Ошибка входа. Проверьте учетные данные.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">LuaTutor</CardTitle>
          <CardDescription>Войдите в свой аккаунт</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                type="text"
                placeholder="Введите имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Вход...
                </>
              ) : (
                "Войти"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

