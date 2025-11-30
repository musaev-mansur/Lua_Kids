"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  useGetLessonQuery, 
  useGetLessonsQuery, 
  useGetCurrentProgressQuery, 
  useCompleteLessonMutation,
  useGetStudentLessonsQuery,
  useGetStudentChallengesQuery
} from "@/lib/api/apiSlice"
import { useAppSelector, useAppDispatch } from "@/lib/hooks"
import { useGetMeQuery, setCredentials } from "@/lib/api/authSlice"
import { StudentNav } from "@/components/student/student-nav"
import { VideoPlayer } from "@/components/lesson/video-player"
import { LuaEditor } from "@/components/lesson/lua-editor"
import { OutputConsole } from "@/components/lesson/output-console"
import { PdfViewer } from "@/components/lesson/pdf-viewer"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, FileText } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import confetti from "canvas-confetti"

const COURSE_ID = "roblox-lua-101"

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const lessonId = params.lessonId as string
  const { user, isAuthenticated, token } = useAppSelector((state) => state.auth)
  const [isClient, setIsClient] = useState(false)

  // Проверяем токен при загрузке, если он есть в localStorage
  const { data: meData, isLoading: meLoading, error: meError } = useGetMeQuery(undefined, {
    skip: isAuthenticated, // Пропускаем только если уже залогинен
  })

  const { data: lesson, isLoading: lessonLoading } = useGetLessonQuery(lessonId)
  const { data: lessons } = useGetLessonsQuery({ courseId: COURSE_ID })
  const { data: progress } = useGetCurrentProgressQuery(
    {
      userId: user?.id || "",
      courseId: COURSE_ID,
    },
    { skip: !user?.id }
  )
  const [completeLesson] = useCompleteLessonMutation()

  // Получаем индивидуальный урок ученика
  const { data: studentLessons } = useGetStudentLessonsQuery(
    { studentId: user?.id, lessonId },
    { skip: !user?.id }
  )
  const studentLesson = studentLessons?.[0]

  // Получаем индивидуальное задание
  const { data: studentChallenges } = useGetStudentChallengesQuery(
    { studentId: user?.id, lessonId },
    { skip: !user?.id }
  )
  const studentChallenge = studentChallenges?.[0]

  // Определяем, какое задание использовать (индивидуальное или общее)
  const challenge = studentChallenge || lesson?.challenge

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Восстанавливаем сессию, если токен валиден
  useEffect(() => {
    if (meData && token && !isAuthenticated) {
      dispatch(setCredentials({ user: meData, token }))
    }
  }, [meData, token, isAuthenticated, dispatch])

  // Очищаем сессию, если токен невалиден
  useEffect(() => {
    if (meError && token && !isAuthenticated) {
      // Токен невалиден, очищаем localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }, [meError, token, isAuthenticated])

  useEffect(() => {
    if (isClient) {
      // Не перенаправляем на логин пока идет проверка токена
      if (meLoading) {
        return
      }
      
      // Если проверка токена завершилась с ошибкой и нет токена, перенаправляем на логин
      if (meError && !token) {
        router.push('/login')
        return
      }
      
      // Если проверка токена завершилась с ошибкой, но токен есть - токен невалиден
      if (meError && token && !isAuthenticated) {
        router.push('/login')
        return
      }
      
      // Если нет токена и не залогинен, перенаправляем на логин
      if (!token && !isAuthenticated && !meLoading) {
        router.push('/login')
      }
    }
  }, [isClient, isAuthenticated, user, token, meError, meLoading, router])

  const nextLesson = lessons?.find((l) => l.order === (lesson?.order || 0) + 1)

  const [output, setOutput] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [checkResult, setCheckResult] = useState<{ message: string; expected?: string; actual?: any } | null>(null)

  // Reset state when lesson changes
  useEffect(() => {
    setOutput([])
    setError(null)
    setIsCompleted(false)
    setShowSuccessModal(false)
    setShowErrorModal(false)
    setCheckResult(null)
  }, [lessonId])

  // Проверяем, заблокирован ли урок
  useEffect(() => {
    if (isClient && lesson && studentLesson) {
      // Если урок не разблокирован для ученика, перенаправляем
      if (!studentLesson.isUnlocked && lesson.order > 1) {
        router.push('/')
      }
    } else if (isClient && lesson && lessons && progress) {
      // Fallback: проверяем по старой логике, если нет индивидуального урока
      if (lesson.order === 1) {
        return
      }
      
      if (lesson.order > 1) {
        const previousLesson = lessons.find(l => l.order === lesson.order - 1)
        if (previousLesson && !progress.completedLessonIds.includes(previousLesson.id)) {
          router.push('/')
        }
      }
    }
  }, [isClient, lesson, studentLesson, lessons, progress, router])

  // На сервере показываем загрузку, чтобы избежать hydration mismatch
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (lessonLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка урока...</div>
      </div>
    )
  }

  if (!lesson) {
    return <div className="p-8">Lesson not found</div>
  }

  const handleRunCode = async (code: string, output: string[], error: string | null) => {
    setIsRunning(true)
    
    // Показываем вывод или ошибку
    if (error) {
      setOutput([`Error: ${error}`])
      setIsRunning(false)
      return
    } else {
      setOutput(output.length > 0 ? output : ["(no output)"])
    }

    // Отправляем результаты на backend для проверки
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '/api' : 'http://localhost:8000/api')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      
      const response = await fetch(`${API_BASE_URL}/check_code/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Token ${token}` }),
        },
        body: JSON.stringify({
          lesson_id: lesson.id,
          code: code,
          output: output,
          error: error,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Сохраняем результат проверки
        setCheckResult({
          message: result.message || '',
          expected: result.expected,
          actual: result.actual,
        })
        
        // Если код успешно выполнен (passed = true)
        if (result.passed) {
          setIsCompleted(true)
          
          // Если задание отправлено на проверку, показываем соответствующее сообщение
          if (result.submission_id) {
            setShowSuccessModal(true)
            // Не переходим автоматически, ждем одобрения админа
          } else {
            // Старая логика для обратной совместимости
            setShowSuccessModal(true)
            
            if (user) {
              try {
                await completeLesson({
                  userId: user.id,
                  courseId: COURSE_ID,
                  lessonId: lesson.id,
                }).unwrap()
              } catch (err) {
                console.error('Failed to complete lesson:', err)
              }
            }
            
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            })

            const currentNextLesson = lessons?.find((l) => l.order === (lesson?.order || 0) + 1)
            setTimeout(() => {
              if (currentNextLesson) {
                router.push(`/lesson/${currentNextLesson.id}`)
              } else {
                router.push("/")
              }
            }, 2000)
          }
        } else {
          // Код не прошел проверку - задание НЕ отправлено
          setIsCompleted(false)
          setShowErrorModal(true)
          // Показываем ошибку в консоли вывода
          if (result.message) {
            setError(result.message)
          }
        }
      } else {
        // Ошибка при запросе к API
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Ошибка при проверке кода')
      }
    } catch (err) {
      console.error('Failed to check code on backend:', err)
      // Fallback: проверяем локально, если backend недоступен
      if (lesson.challenge && lesson.challenge.expectedOutput && !error) {
        const passed = output.some((line) => line.trim() === lesson.challenge?.expectedOutput)
        if (passed) {
          setIsCompleted(true)
          setShowSuccessModal(true)
          if (user) {
            try {
              await completeLesson({
                userId: user.id,
                courseId: COURSE_ID,
                lessonId: lesson.id,
              }).unwrap()
            } catch (err) {
              console.error('Failed to complete lesson:', err)
            }
          }
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          })

          // Автоматически переходим на следующий урок через 2 секунды
          const currentNextLesson = lessons?.find((l) => l.order === (lesson?.order || 0) + 1)
          setTimeout(() => {
            if (currentNextLesson) {
              router.push(`/lesson/${currentNextLesson.id}`)
            } else {
              router.push("/")
            }
          }, 2000)
        }
      }
    } finally {
      setIsRunning(false)
    }
  }

  const handleNextLesson = () => {
    if (nextLesson) {
      router.push(`/lesson/${nextLesson.id}`)
    } else {
      router.push("/")
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StudentNav />

      <div className="flex-1 container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-4rem)] max-w-7xl">
        {/* Left Panel: Content */}
        <div className="space-y-6 overflow-y-auto pr-2 pb-20">
          <div>
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary flex items-center mb-4">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Назад к курсу
            </Link>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <p className="text-muted-foreground">{lesson.description}</p>
          </div>

          <VideoPlayer url={lesson.videoUrl} />

          <div className="prose dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{lesson.content}</div>
            {lesson.pdfFileUrl && (
              <a
                href={lesson.pdfFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline mt-4"
              >
                <FileText className="h-4 w-4" />
                Скачать PDF
              </a>
            )}
          </div>
          

          {challenge && (
            <Alert className="bg-primary/5 border-primary/20">
              <CheckCircle className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary font-bold">Задача</AlertTitle>
              <AlertDescription>{challenge.instructions}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Right Panel: Editor */}
        <div className="flex flex-col gap-4 pb-6">
          <div className="flex-1 min-h-[400px]">
            <LuaEditor
              initialCode={challenge?.initialCode || "-- Write your code here"}
              onRun={handleRunCode}
              isRunning={isRunning}
              height="500px"
              lessonId={lessonId}
            />
          </div>
          <OutputConsole 
            output={output} 
            error={error}
            status={error ? "error" : isCompleted ? "success" : undefined} 
          />
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              {isCompleted ? 'Задание отправлено!' : 'Код выполнен!'}
            </DialogTitle>
            <DialogDescription>
              {isCompleted 
                ? `Отлично! Ваше задание отправлено на проверку админу. После одобрения вам будет открыт доступ к следующему уроку.`
                : `Ваш код выполнен. Задание отправлено на проверку админу.`
              }
              {!isCompleted && (
                <span className="text-xs text-muted-foreground mt-2 block">
                  Ожидайте проверки админом...
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <div className="text-4xl">🎉</div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="secondary" onClick={() => setShowSuccessModal(false)}>
              Остаться здесь
            </Button>
            {isCompleted && nextLesson && (
              <Button onClick={handleNextLesson} className="gap-2">
                Следующий урок
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={() => setShowErrorModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Задание не пройдено
            </DialogTitle>
            <DialogDescription>
              {checkResult?.message || 'Ваш код не прошел автоматическую проверку.'}
            </DialogDescription>
          </DialogHeader>
          {checkResult?.expected && (
            <div className="mt-4 space-y-2">
              <div className="text-sm">
                <span className="font-semibold">Ожидалось:</span>{' '}
                <code className="bg-muted px-2 py-1 rounded">{checkResult.expected}</code>
              </div>
              {checkResult.actual && (
                <div className="text-sm">
                  <span className="font-semibold">Получено:</span>{' '}
                  <code className="bg-muted px-2 py-1 rounded">
                    {Array.isArray(checkResult.actual) 
                      ? checkResult.actual.join(', ') 
                      : String(checkResult.actual)}
                  </code>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Исправьте код и попробуйте снова. Задание будет отправлено на проверку только после успешного выполнения.
          </p>
          <DialogFooter>
            <Button onClick={() => setShowErrorModal(false)}>
              Понятно
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
