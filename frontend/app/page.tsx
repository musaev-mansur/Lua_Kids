"use client"

import { StudentNav } from "@/components/student/student-nav"
import { LessonCard } from "@/components/student/lesson-card"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Rocket, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useGetCoursesQuery, useGetCourseQuery, useGetCurrentProgressQuery, useGetStudentLessonsQuery } from "@/lib/api/apiSlice"
import { useAppSelector, useAppDispatch } from "@/lib/hooks"
import { useGetMeQuery } from "@/lib/api/authSlice"
import { setCredentials } from "@/lib/api/authSlice"
import type { Lesson, Course } from "@/lib/types"

export default function DashboardPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, token } = useAppSelector((state) => state.auth)
  const [isClient, setIsClient] = useState(false)
  
  // Проверяем токен при загрузке, если он есть в localStorage
  // Пропускаем только если уже залогинен (чтобы не делать лишние запросы)
  const { data: meData, isLoading: meLoading, error: meError } = useGetMeQuery(undefined, {
    skip: isAuthenticated, // Пропускаем только если уже залогинен
  })
  
  // 1. Загружаем список всех курсов
  const { data: courses, isLoading: coursesLoading } = useGetCoursesQuery()
  
  // 2. Выбираем курс. Логика:
  // - Если курсов нет -> null
  // - Ищем курс, название которого совпадает с именем пользователя (user.name)
  // - Если такого нет -> берем ПЕРВЫЙ курс из списка (courses[0])
  const selectedCourse = courses?.find(c => c.title === user?.name) || (courses && courses.length > 0 ? courses[0] : null)
  const courseId = selectedCourse?.id
  
  // 3. Загружаем детали выбранного курса (уроки и т.д.)
  const { data: course, isLoading: courseLoading, error: courseError } = useGetCourseQuery(courseId || "", {
    skip: !courseId
  })

  const { data: progress, isLoading: progressLoading } = useGetCurrentProgressQuery(
    {
      userId: user?.id || "",
      courseId: courseId || "",
    },
    { skip: !user?.id || !courseId }
  )
  
  // Получаем индивидуальные уроки ученика
  const { data: studentLessons, isLoading: studentLessonsLoading, error: studentLessonsError } = useGetStudentLessonsQuery(
    { studentId: user?.id },
    { skip: !user?.id }
  )
  

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

  // На сервере показываем загрузку, чтобы избежать hydration mismatch
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

  // Показываем загрузку, если загружаются основные данные
  // studentLessonsLoading не блокирует отображение, так как фильтрация работает и без них
  if (courseLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive">
          Курс не найден. Убедитесь, что начальные данные загружены в backend.
          <br />
          <code className="text-sm mt-2 block">python manage.py load_initial_data</code>
        </div>
      </div>
    )
  }


  // Фильтруем уроки: показываем ТОЛЬКО уроки из StudentLesson
  // Если StudentLesson загружены (даже если массив пустой), используем их
  // Если StudentLesson еще не загружены, показываем все уроки (fallback только во время загрузки)
  const hasLoadedStudentLessons = studentLessons !== undefined && !studentLessonsLoading
  const hasIndividualLessons = studentLessons && studentLessons.length > 0
  
  let displayedLessons: Lesson[] = []
  
  // Всегда используем StudentLesson, если они загружены
  if (hasLoadedStudentLessons && hasIndividualLessons) {
    // Создаем Set из ID уроков, которые есть в StudentLesson
    const studentLessonIds = new Set<string>()
    
    studentLessons.forEach(sl => {
      let lessonId: string | null = null
      
      if (sl.lesson) {
        if (typeof sl.lesson === 'object' && 'id' in sl.lesson) {
          // lesson - это объект Lesson
          lessonId = String(sl.lesson.id)
        } else if (typeof sl.lesson === 'string') {
          // lesson - это строка ID (старый формат)
          lessonId = sl.lesson
        }
      }
      
      if (lessonId) {
        studentLessonIds.add(lessonId)
      }
    })
    
    
    // Фильтруем уроки, оставляя только те, которые есть в StudentLesson
    displayedLessons = course.lessons.filter(lesson => {
      const isIncluded = studentLessonIds.has(String(lesson.id))
      return isIncluded
    })
    
  } else if (hasLoadedStudentLessons && !hasIndividualLessons) {
    // StudentLessons загружены, но пустой массив - у ученика нет назначенных уроков
    displayedLessons = []
  } else {
    // StudentLessons еще не загружены - показываем все уроки (fallback только во время загрузки)
    displayedLessons = course.lessons || []
  }
  
  // Создаем мапу StudentLesson для быстрого доступа
  // Нормализуем ключи к строкам для корректного сравнения
  const studentLessonsMap = new Map(
    studentLessons?.map(sl => {
      const lessonId = sl.lesson ? (typeof sl.lesson === 'object' ? sl.lesson.id : sl.lesson) : null
      return lessonId ? [String(lessonId), sl] : null
    }).filter((item): item is [string, typeof studentLessons[0]] => item !== null) || []
  )
  
  const completedCount = progress?.completedLessonIds.length || 0
  const totalLessons = displayedLessons.length
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StudentNav />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Привет, {user.name}! 👋</h1>
            <p className="text-muted-foreground mt-1">Готовы продолжить свое путешествие в {course.title}?</p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="col-span-2 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                Текущий прогресс курса
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium">
                  <span>{progressPercentage}% Завершено</span>
                  <span>
                    {completedCount}/{totalLessons} Уроков
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {progressPercentage === 100
                    ? "Поздравляем! Вы завершили курс!"
                    : "Продолжайте в том же духе! Вы делаете это очень хорошо."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Ваша статистика
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Общее количество опыта</span>
                  <span className="font-bold text-xl">{user.xp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Текущий уровень</span>
                  <span className="font-bold text-xl">{user.level}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lesson List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Уроки</h2>
          {studentLessonsLoading ? (
            <div className="text-muted-foreground">Загрузка уроков...</div>
          ) : (
            <div className="grid gap-4">
              {displayedLessons && displayedLessons.length > 0 ? (
                displayedLessons.map((lesson: Lesson) => {
                  // Проверяем статус из StudentLesson, если он есть
                  // Используем String для нормализации ID
                  const studentLesson = studentLessonsMap.get(String(lesson.id))
                  const isCompleted = studentLesson?.isCompleted || progress?.completedLessonIds.includes(lesson.id) || false
                  const isCurrent = progress?.currentLessonId === lesson.id
                  // Определяем, заблокирован ли урок (из StudentLesson или из общей логики)
                  const isLocked = studentLesson ? !studentLesson.isUnlocked : lesson.isLocked

                  return (
                    <LessonCard 
                      key={lesson.id} 
                      lesson={{ ...lesson, isLocked }} 
                      isCompleted={isCompleted} 
                      isCurrent={isCurrent}
                      allLessons={displayedLessons}
                      completedLessonIds={progress?.completedLessonIds || []}
                    />
                  )
                })
              ) : (
                <div className="text-muted-foreground">
                  {hasLoadedStudentLessons && !hasIndividualLessons
                    ? "У вас пока нет назначенных уроков. Обратитесь к администратору."
                    : hasLoadedStudentLessons
                    ? "Уроки не найдены"
                    : "Загрузка уроков..."}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
