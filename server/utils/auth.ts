import { auth } from './firebase-admin'
import { H3Event } from 'h3'

export interface AuthResult {
  isAuthenticated: boolean
  currentUserId: string | null
  error?: {
    statusCode: number
    message: string
  }
}

export const checkAuth = async (event: H3Event): Promise<AuthResult> => {
  const cookies = event.node.req.headers.cookie
  if (!cookies) {
    return {
      isAuthenticated: false,
      currentUserId: null,
      error: {
        statusCode: 401,
        message: 'Отсутствует токен авторизации'
      }
    }
  }

  const token = cookies.split(';')
    .find(c => c.trim().startsWith('auth_token='))
    ?.split('=')[1]

  if (!token) {
    return {
      isAuthenticated: false,
      currentUserId: null,
      error: {
        statusCode: 401,
        message: 'Отсутствует токен авторизации'
      }
    }
  }

  try {
    const decodedToken = await auth.verifyIdToken(token)
    return {
      isAuthenticated: true,
      currentUserId: decodedToken.uid
    }
  } catch (error) {
    console.error('Ошибка проверки токена:', error)
    return {
      isAuthenticated: false,
      currentUserId: null,
      error: {
        statusCode: 401,
        message: 'Недействительный токен'
      }
    }
  }
}

export const requireAuth = async (event: H3Event, uid?: string): Promise<AuthResult> => {
  const authResult = await checkAuth(event)

  if (!authResult.isAuthenticated) {
    return authResult
  }

  if (uid && authResult.currentUserId !== uid) {
    return {
      isAuthenticated: false,
      currentUserId: null,
      error: {
        statusCode: 403,
        message: 'Нет доступа к этому ресурсу'
      }
    }
  }

  return authResult
}
