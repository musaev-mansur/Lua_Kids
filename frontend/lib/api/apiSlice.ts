import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { 
  Course, Lesson, User, UserProgress,
  StudentLesson, StudentChallenge, Submission, SubmissionStatus
} from '../types'

// Для локальной разработки используем localhost:8000, для продакшна - переменную окружения
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Преобразование данных из API в формат frontend
const transformCourse = (apiCourse: any): Course => ({
  id: apiCourse.id,
  title: apiCourse.title,
  description: apiCourse.description,
  thumbnailUrl: apiCourse.thumbnail_url || undefined,
  lessons: apiCourse.lessons || [],
})

const transformLesson = (apiLesson: any): Lesson => ({
  id: apiLesson.id,
  course: apiLesson.course,
  title: apiLesson.title,
  description: apiLesson.description,
  order: apiLesson.order,
  videoUrl: apiLesson.video_url || undefined,
  pdfFile: apiLesson.pdf_file || undefined,
  pdfFileUrl: apiLesson.pdf_file_url || undefined,
  content: apiLesson.content,
  duration: apiLesson.duration,
  xpReward: apiLesson.xp_reward,
  isLocked: apiLesson.is_locked,
  challenge: apiLesson.challenge
    ? {
        instructions: apiLesson.challenge.instructions,
        initialCode: apiLesson.challenge.initial_code,
        expectedOutput: apiLesson.challenge.expected_output || undefined,
        hints: apiLesson.challenge.hints || [],
      }
    : undefined,
})

const transformSubmission = (apiSubmission: any): Submission => {
  // Обрабатываем output - может быть строкой или массивом
  let output: string[] = []
  if (apiSubmission.output) {
    if (Array.isArray(apiSubmission.output)) {
      output = apiSubmission.output
    } else if (typeof apiSubmission.output === 'string') {
      output = apiSubmission.output.split('\n').filter((line: string) => line.trim())
    }
  }
  
  return {
    id: apiSubmission.id,
    student: apiSubmission.student,
    studentUsername: apiSubmission.student_username || undefined,
    lesson: apiSubmission.lesson,
    lessonTitle: apiSubmission.lesson_title || undefined,
    code: apiSubmission.code || '',
    output: output,
    error: apiSubmission.error || undefined,
    passedAutoCheck: apiSubmission.passed_auto_check || false,
    status: apiSubmission.status as SubmissionStatus,
    adminComment: apiSubmission.admin_comment || undefined,
    reviewedBy: apiSubmission.reviewed_by || undefined,
    reviewedByUsername: apiSubmission.reviewed_by_username || undefined,
    reviewedAt: apiSubmission.reviewed_at || undefined,
    submittedAt: apiSubmission.submitted_at || apiSubmission.created_at || new Date().toISOString(),
    updatedAt: apiSubmission.updated_at || new Date().toISOString(),
  }
}

export const transformUser = (apiUser: any): User => {
  // Обработка разных форматов ответа
  const userId = apiUser.id?.toString() || apiUser.pk?.toString() || String(apiUser.id || apiUser.pk || '')
  const userName = apiUser.first_name || apiUser.name || apiUser.username || ''
  
  return {
    id: userId,
    name: userName,
    role: apiUser.role || 'student',
    avatarUrl: apiUser.avatar_url || undefined,
    level: apiUser.level || 1,
    xp: apiUser.xp || 0,
  }
}

const transformProgress = (apiProgress: any): UserProgress => ({
  userId: apiProgress.user.toString(),
  courseId: apiProgress.course,
  completedLessonIds: apiProgress.completed_lesson_ids || [],
  currentLessonId: apiProgress.current_lesson_id || '',
})

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState, endpoint, extra }) => {
      // Получаем токен из Redux state
      const state = getState() as any
      const token = state?.auth?.token
      const isAuthenticated = state?.auth?.isAuthenticated
      
      // Для /auth/me/ отправляем токен даже если isAuthenticated === false,
      // чтобы проверить валидность токена при восстановлении сессии
      const isAuthMeEndpoint = endpoint === 'getMe' || endpoint?.toString().includes('/auth/me/')
      
      // Отправляем токен если:
      // 1. Пользователь залогинен ИЛИ
      // 2. Это эндпоинт проверки токена (/auth/me/) и токен есть
      if (token && token.trim() && (isAuthenticated || isAuthMeEndpoint)) {
        headers.set('Authorization', `Token ${token}`)
      }
      
      // Не устанавливаем Content-Type для FormData, браузер установит его автоматически
      // RTK Query автоматически определяет FormData и не устанавливает Content-Type
      
      return headers
    },
  }),
  tagTypes: ['Course', 'Lesson', 'User', 'Progress', 'StudentLesson', 'StudentChallenge', 'Submission'],
  endpoints: (builder) => ({
    // Courses
    getCourses: builder.query<Course[], void>({
      query: () => '/courses/',
      transformResponse: (response: any) => {
        // Поддержка пагинации (results) и простого массива
        const items = Array.isArray(response) ? response : (response?.results || [])
        
        if (Array.isArray(items)) {
          return items.map(transformCourse)
        }
        return []
      },
      providesTags: ['Course'],
    }),
    getCourse: builder.query<Course, string>({
      query: (id) => `/courses/${id}/`,
      transformResponse: transformCourse,
      providesTags: (result, error, id) => [{ type: 'Course', id }],
    }),
    getCourseLessons: builder.query<Lesson[], string>({
      query: (courseId) => `/courses/${courseId}/lessons/`,
      transformResponse: (response: any) => {
        if (Array.isArray(response)) {
          return response.map(transformLesson)
        }
        return []
      },
      providesTags: (result, error, courseId) => [
        { type: 'Lesson', id: `LIST-${courseId}` },
      ],
    }),

    // Lessons
    getLessons: builder.query<Lesson[], { courseId?: string } | void>({
      query: (params) => {
        if (params?.courseId) {
          return `/lessons/?course=${params.courseId}`
        }
        return '/lessons/'
      },
      transformResponse: (response: any) => {
        if (Array.isArray(response)) {
          return response.map(transformLesson)
        }
        return []
      },
      providesTags: ['Lesson'],
    }),
    getLesson: builder.query<Lesson, string>({
      query: (id) => `/lessons/${id}/`,
      transformResponse: transformLesson,
      providesTags: (result, error, id) => [{ type: 'Lesson', id }],
    }),
    createLesson: builder.mutation<Lesson, Partial<Lesson> & { course: string }>({
      query: (lesson) => ({
        url: '/lessons/',
        method: 'POST',
        body: {
          id: lesson.id,
          course: lesson.course,
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          video_url: lesson.videoUrl,
          content: lesson.content,
          duration: lesson.duration,
          xp_reward: lesson.xpReward,
          is_locked: lesson.isLocked,
          challenge: lesson.challenge
            ? {
                instructions: lesson.challenge.instructions,
                initial_code: lesson.challenge.initialCode,
                expected_output: lesson.challenge.expectedOutput,
                hints: lesson.challenge.hints || [],
              }
            : undefined,
        },
      }),
      transformResponse: transformLesson,
      invalidatesTags: ['Lesson', 'Course'],
    }),
    updateLesson: builder.mutation<Lesson, Partial<Lesson> & { id: string; course: string }>({
      query: ({ id, ...lesson }) => ({
        url: `/lessons/${id}/`,
        method: 'PUT',
        body: {
          id,
          course: lesson.course,
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          video_url: lesson.videoUrl,
          content: lesson.content,
          duration: lesson.duration,
          xp_reward: lesson.xpReward,
          is_locked: lesson.isLocked,
          challenge: lesson.challenge
            ? {
                instructions: lesson.challenge.instructions,
                initial_code: lesson.challenge.initialCode,
                expected_output: lesson.challenge.expectedOutput,
                hints: lesson.challenge.hints || [],
              }
            : undefined,
        },
      }),
      transformResponse: transformLesson,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Lesson', id },
        'Lesson',
        'Course',
      ],
    }),
    deleteLesson: builder.mutation<void, string>({
      query: (id) => ({
        url: `/lessons/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Lesson', 'Course'],
    }),

    // Users
    getUsers: builder.query<User[], void>({
      query: () => '/users/',
      transformResponse: (response: any[]) => response.map(transformUser),
      providesTags: ['User'],
    }),
    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}/`,
      transformResponse: transformUser,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    // Progress
    getProgress: builder.query<UserProgress[], { userId?: string; courseId?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params?.userId) searchParams.append('user', params.userId)
        if (params?.courseId) searchParams.append('course', params.courseId)
        const query = searchParams.toString()
        return `/progress/${query ? `?${query}` : ''}`
      },
      transformResponse: (response: any) => {
        if (Array.isArray(response)) {
          return response.map(transformProgress)
        }
        return []
      },
      providesTags: ['Progress'],
    }),
    getCurrentProgress: builder.query<UserProgress | null, { userId: string; courseId: string }>({
      query: ({ userId, courseId }) =>
        `/progress/current/?user_id=${userId}&course_id=${courseId}`,
      transformResponse: (response: any) => {
        if (response.error) {
          return null
        }
        return transformProgress(response)
      },
      providesTags: ['Progress'],
    }),
    completeLesson: builder.mutation<UserProgress, { userId: string; courseId: string; lessonId: string }>({
      query: (body) => ({
        url: '/progress/complete_lesson/',
        method: 'POST',
        body: {
          user_id: body.userId,
          course_id: body.courseId,
          lesson_id: body.lessonId,
        },
      }),
      transformResponse: transformProgress,
      invalidatesTags: ['Progress'],
    }),
    createProgress: builder.mutation<UserProgress, Partial<UserProgress>>({
      query: (progress) => ({
        url: '/progress/',
        method: 'POST',
        body: {
          user: progress.userId,
          course: progress.courseId,
          completed_lesson_ids: progress.completedLessonIds || [],
          current_lesson_id: progress.currentLessonId || '',
        },
      }),
      transformResponse: transformProgress,
      invalidatesTags: ['Progress'],
    }),

    // Student Lessons
    getStudentLessons: builder.query<StudentLesson[], { studentId?: string; lessonId?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params?.studentId) searchParams.append('student', params.studentId)
        if (params?.lessonId) searchParams.append('lesson', params.lessonId)
        const query = searchParams.toString()
        return `/student-lessons/${query ? `?${query}` : ''}`
      },
      transformResponse: (response: any) => {
        // Обрабатываем как массив, так и объект с пагинацией (results)
        const items = Array.isArray(response) ? response : (response?.results || [])
        
        if (Array.isArray(items) && items.length > 0) {
          return items.map((item: any) => ({
            id: item.id,
            student: item.student,
            lesson: item.lesson ? transformLesson(item.lesson) : null as Lesson | null,  // Преобразуем объект урока
            lessonTitle: item.lesson_title,
            lessonOrder: item.lesson_order,
            isUnlocked: item.is_unlocked,
            isCompleted: item.is_completed,
            completedAt: item.completed_at,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          })) as StudentLesson[]
        }
        
        return []
      },
      providesTags: ['StudentLesson'],
    }),
    getStudentLesson: builder.query<StudentLesson, number>({
      query: (id) => `/student-lessons/${id}/`,
      transformResponse: (response: any): StudentLesson => ({
        id: response.id,
        student: response.student,
        lesson: response.lesson ? transformLesson(response.lesson) : null as Lesson | null,  // Преобразуем объект урока
        lessonTitle: response.lesson_title,
        lessonOrder: response.lesson_order,
        isUnlocked: response.is_unlocked,
        isCompleted: response.is_completed,
        completedAt: response.completed_at,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
      }),
      providesTags: (result, error, id) => [{ type: 'StudentLesson', id }],
    }),
    unlockStudentLesson: builder.mutation<StudentLesson, number>({
      query: (id) => ({
        url: `/student-lessons/${id}/unlock/`,
        method: 'POST',
      }),
      invalidatesTags: ['StudentLesson'],
    }),
    completeStudentLesson: builder.mutation<StudentLesson, number>({
      query: (id) => ({
        url: `/student-lessons/${id}/complete/`,
        method: 'POST',
      }),
      invalidatesTags: ['StudentLesson', 'Progress'],
    }),

    // Student Challenges
    getStudentChallenges: builder.query<StudentChallenge[], { studentId?: string; lessonId?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params?.studentId) searchParams.append('student', params.studentId)
        if (params?.lessonId) searchParams.append('lesson', params.lessonId)
        const query = searchParams.toString()
        return `/student-challenges/${query ? `?${query}` : ''}`
      },
      providesTags: ['StudentChallenge'],
    }),
    getStudentChallenge: builder.query<StudentChallenge, number>({
      query: (id) => `/student-challenges/${id}/`,
      providesTags: (result, error, id) => [{ type: 'StudentChallenge', id }],
    }),

    // Submissions
    getSubmissions: builder.query<Submission[], { studentId?: string; lessonId?: string; status?: SubmissionStatus } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params?.studentId) searchParams.append('student', params.studentId)
        if (params?.lessonId) searchParams.append('lesson', params.lessonId)
        if (params?.status) searchParams.append('status', params.status)
        const query = searchParams.toString()
        return `/submissions/${query ? `?${query}` : ''}`
      },
      transformResponse: (response: any) => {
        // Обрабатываем как массив, так и объект с пагинацией (results)
        const items = Array.isArray(response) ? response : (response?.results || [])
        
        if (Array.isArray(items) && items.length > 0) {
          return items.map((item: any) => transformSubmission(item)) as Submission[]
        }
        return []
      },
      providesTags: ['Submission'],
    }),
    getSubmission: builder.query<Submission, number>({
      query: (id) => `/submissions/${id}/`,
      transformResponse: (response: any) => transformSubmission(response),
      providesTags: (result, error, id) => [{ type: 'Submission', id }],
    }),
    approveSubmission: builder.mutation<Submission, { id: number; adminComment?: string }>({
      query: ({ id, adminComment }) => ({
        url: `/submissions/${id}/approve/`,
        method: 'POST',
        body: { admin_comment: adminComment },
      }),
      transformResponse: (response: any) => transformSubmission(response),
      invalidatesTags: ['Submission', 'StudentLesson'],
    }),
    rejectSubmission: builder.mutation<Submission, { id: number; adminComment?: string }>({
      query: ({ id, adminComment }) => ({
        url: `/submissions/${id}/reject/`,
        method: 'POST',
        body: { admin_comment: adminComment },
      }),
      transformResponse: (response: any) => transformSubmission(response),
      invalidatesTags: ['Submission'],
    }),
  }),
})

export const {
  useGetCoursesQuery,
  useGetCourseQuery,
  useGetCourseLessonsQuery,
  useGetLessonsQuery,
  useGetLessonQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useGetUsersQuery,
  useGetUserQuery,
  useGetProgressQuery,
  useGetCurrentProgressQuery,
  useCompleteLessonMutation,
  useCreateProgressMutation,
  // Student Lessons
  useGetStudentLessonsQuery,
  useGetStudentLessonQuery,
  useUnlockStudentLessonMutation,
  useCompleteStudentLessonMutation,
  // Student Challenges
  useGetStudentChallengesQuery,
  useGetStudentChallengeQuery,
  // Submissions
  useGetSubmissionsQuery,
  useGetSubmissionQuery,
  useApproveSubmissionMutation,
  useRejectSubmissionMutation,
} = apiSlice

