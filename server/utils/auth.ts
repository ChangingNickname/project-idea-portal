import { auth, type AuthResult } from './firebase-admin'
import { getRequestHeader, createError } from 'h3'
import type { H3Event } from 'h3'

export interface AuthResponse {
  isAuthenticated: boolean
  currentUserId: string | null
  emailVerified: boolean
}

export const checkAuth = async (event: H3Event): Promise<AuthResponse> => {
  try {
    const authHeader = getRequestHeader(event, 'authorization')
    if (!authHeader) {
      // Проверяем куки, если нет заголовка
      const cookies = getRequestHeader(event, 'cookie')
      if (!cookies) {
        return {
          isAuthenticated: false,
          currentUserId: null,
          emailVerified: false
        }
      }

      const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('auth_token='))
      if (!tokenCookie) {
        return {
          isAuthenticated: false,
          currentUserId: null,
          emailVerified: false
        }
      }

      const [, token] = tokenCookie.split('=')
      if (!token) {
        return {
          isAuthenticated: false,
          currentUserId: null,
          emailVerified: false
        }
      }

      const decodedToken = await auth.verifyIdToken(token.trim())
      
      return {
        isAuthenticated: true,
        currentUserId: decodedToken.uid,
        emailVerified: decodedToken.email_verified || false
      }
    }

    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await auth.verifyIdToken(token)
    
    return {
      isAuthenticated: true,
      currentUserId: decodedToken.uid,
      emailVerified: decodedToken.email_verified || false
    }
  } catch (error) {
    console.error('Auth error:', error)
    return {
      isAuthenticated: false,
      currentUserId: null,
      emailVerified: false
    }
  }
}

export const requireAuth = async (event: H3Event, uid?: string): Promise<AuthResponse> => {
  const authResult = await checkAuth(event)

  if (!authResult.isAuthenticated) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  if (uid && authResult.currentUserId !== uid) {
    throw createError({
      statusCode: 403,
      message: 'Access denied'
    })
  }

  return authResult
}
