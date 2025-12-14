export type Role = "student" | "teacher" | "admin"

export interface User {
  id: string
  name: string
  role: Role
  avatarUrl?: string
  level: number
  xp: number
}

export interface Lesson {
  id: string
  title: string
  description: string
  order: number
  videoUrl?: string // YouTube or uploaded
  pdfFile?: string // PDF file path
  pdfFileUrl?: string // PDF file URL
  content: string // Markdown text
  duration: number // minutes
  xpReward: number
  isLocked: boolean
  course?: string // Course ID
  challenge?: {
    initialCode: string
    expectedOutput?: string
    instructions: string
    hints?: string[]
  }
}

export interface Course {
  id: string
  title: string
  description: string
  lessons: Lesson[]
  thumbnailUrl?: string
}

export interface UserProgress {
  userId: string
  courseId: string
  completedLessonIds: string[]
  currentLessonId: string
}

export interface StudentLesson {
  id: number
  student: number
  lesson: Lesson | null  // Полный объект урока вместо строки ID (может быть null)
  lessonTitle?: string
  lessonOrder?: number
  isUnlocked: boolean
  isCompleted: boolean
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface StudentChallenge {
  id: number
  student: number
  lesson: string
  lessonTitle?: string
  instructions: string
  initialCode: string
  expectedOutput?: string
  hints: string[]
  createdAt: string
  updatedAt: string
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface Submission {
  id: number
  student: number
  studentUsername?: string
  lesson: string
  lessonTitle?: string
  code: string
  output: string[]
  error?: string
  passedAutoCheck: boolean
  status: SubmissionStatus
  adminComment?: string
  reviewedBy?: number
  reviewedByUsername?: string
  reviewedAt?: string
  submittedAt: string
  updatedAt: string
}
