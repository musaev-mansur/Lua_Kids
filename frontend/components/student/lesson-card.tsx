import Link from "next/link"
import type { Lesson } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlayCircle, Lock, CheckCircle, Clock, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface LessonCardProps {
  lesson: Lesson
  isCompleted: boolean
  isCurrent: boolean
  allLessons?: Lesson[]
  completedLessonIds?: string[]
}

export function LessonCard({ lesson, isCompleted, isCurrent, allLessons, completedLessonIds }: LessonCardProps) {
  // Определяем, заблокирован ли урок
  // Используем isLocked из API (который уже учитывает прогресс пользователя)
  // И дополнительно проверяем на основе локального прогресса как fallback
  let isLocked = lesson.isLocked
  
  // Если есть локальный прогресс, используем его для дополнительной проверки
  // (это fallback на случай, если API не вернул правильное значение)
  if (lesson.order > 1 && allLessons && completedLessonIds) {
    const previousLesson = allLessons.find(l => l.order === lesson.order - 1)
    if (previousLesson) {
      // Урок заблокирован, если предыдущий урок не выполнен
      const previousNotCompleted = !completedLessonIds.includes(previousLesson.id)
      // Используем более строгую проверку: заблокирован, если предыдущий не выполнен
      isLocked = previousNotCompleted || isLocked
    }
  }
  
  // Первый урок всегда доступен
  if (lesson.order === 1) {
    isLocked = false
  }
  
  // Урок не заблокирован, если он уже выполнен или является текущим
  if (isCompleted || isCurrent) {
    isLocked = false
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        isCurrent && "border-primary ring-1 ring-primary/50 bg-primary/5",
        isLocked && "opacity-75 bg-muted/50",
      )}
    >
      <CardContent className="p-0 flex items-center">
        <div
          className={cn(
            "flex items-center justify-center w-16 h-full min-h-20 border-r",
            isCompleted
              ? "bg-green-500/10 text-green-600"
              : isCurrent
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
          )}
        >
          {isCompleted ? (
            <CheckCircle className="h-6 w-6" />
          ) : isLocked ? (
            <Lock className="h-6 w-6" />
          ) : (
            <span className="font-bold text-lg">{lesson.order}</span>
          )}
        </div>

        <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{lesson.title}</h3>
              {isCurrent && <Badge>Текущий</Badge>}
              {isCompleted && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Завершено
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">{lesson.description}</p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{lesson.duration} минут</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
                <Trophy className="h-3 w-3" />
                <span>{lesson.xpReward} XP</span>
              </div>
            </div>
          </div>

          <div>
            {isLocked ? (
              <Button disabled variant="secondary" size="sm">
                <Lock className="mr-2 h-4 w-4" />
                 Недоступно
              </Button>
            ) : (
              <Link href={`/lesson/${lesson.id}`}>
                <Button
                  size="sm"
                  className={cn(
                    isCurrent ? "bg-primary" : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                  )}
                >
                  {isCompleted ? "Проверить" : "Начать урок"}
                  <PlayCircle className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
