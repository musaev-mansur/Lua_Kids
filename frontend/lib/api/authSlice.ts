import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { apiSlice, transformUser } from './apiSlice'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// Инициализация из localStorage (если доступно)
// НЕ устанавливаем isAuthenticated = true при инициализации,
// чтобы не отправлять неверные токены. Токен будет проверен при первом запросе.
const getInitialState = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
    }
  }

  const token = localStorage.getItem('token')
  const savedUser = localStorage.getItem('user')
  
  let user: User | null = null
  if (savedUser) {
    try {
      user = JSON.parse(savedUser)
    } catch {
      // Игнорируем ошибки парсинга
    }
  }

  // НЕ устанавливаем isAuthenticated = true при инициализации
  // Это предотвратит отправку неверных токенов
  return {
    user,
    token,
    isAuthenticated: false, // Всегда false при инициализации
  }
}

const initialState: AuthState = getInitialState()

// Auth API endpoints (определяем до authSlice для использования в extraReducers)
export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<{ token: string; user: User }, { username: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login/',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: any) => {
        // Преобразуем пользователя из API формата
        const user = transformUser(response.user)
        return {
          token: response.token,
          user,
        }
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout/',
        method: 'POST',
      }),
    }),
    getMe: builder.query<User, void>({
      query: () => '/auth/me/',
      transformResponse: transformUser,
    }),
  }),
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.token)
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      }
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(action.payload))
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        authApi.endpoints.login.matchFulfilled,
        (state, action) => {
          state.user = action.payload.user
          state.token = action.payload.token
          state.isAuthenticated = true
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', action.payload.token)
            localStorage.setItem('user', JSON.stringify(action.payload.user))
          }
        }
      )
      .addMatcher(
        authApi.endpoints.logout.matchFulfilled,
        (state) => {
          state.user = null
          state.token = null
          state.isAuthenticated = false
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        }
      )
  },
})

export const { setCredentials, logout, updateUser } = authSlice.actions
export default authSlice.reducer

export const { useLoginMutation, useLogoutMutation, useGetMeQuery } = authApi

