import { getAuth } from 'firebase-admin/auth'
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
  const session = event.node.req.headers.cookie?.split(';')
    .find(c => c.trim().startsWith('session='))
    ?.split('=')[1]

  if (!session) {
    return {
      isAuthenticated: false,
      currentUserId: null,
      error: {
        statusCode: 401,
        message: 'Unauthorized'
      }
    }
  }

  try {
    const decodedToken = await getAuth().verifySessionCookie(session, true)
    return {
      isAuthenticated: true,
      currentUserId: decodedToken.uid
    }
  } catch (error) {
    console.error('Session verification failed:', error)
    return {
      isAuthenticated: false,
      currentUserId: null,
      error: {
        statusCode: 401,
        message: 'Invalid session'
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
        message: 'Forbidden'
      }
    }
  }

  return authResult
}
