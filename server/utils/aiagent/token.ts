import jwt from 'jsonwebtoken'
import { H3Event } from 'h3'
import { readBody } from 'h3'

interface TokenPayload {
  type: 'ai-agent-session'
  timestamp: number
}

export const generateToken = (config: { jwtSecret: string }): string => {
  if (!config.jwtSecret || typeof config.jwtSecret !== 'string') {
    throw createError({
      statusCode: 500,
      message: 'JWT secret is not properly configured'
    })
  }

  return jwt.sign(
    { 
      type: 'ai-agent-session',
      timestamp: Date.now()
    } as TokenPayload,
    config.jwtSecret,
    { expiresIn: '1h' }
  )
}

export const validateToken = (token: string, config: { jwtSecret: string }): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    
    if (typeof decoded === 'string') {
      throw new Error('Invalid token format')
    }

    const payload = decoded as TokenPayload
    if (payload.type !== 'ai-agent-session') {
      throw new Error('Invalid token type')
    }

    return payload
  } catch (error) {
    throw createError({
      statusCode: 401,
      message: 'Invalid session token'
    })
  }
}

export const getTokenFromEvent = async (event: H3Event): Promise<string> => {
  const body = await readBody(event)
  if (!body?.sessionToken) {
    throw createError({
      statusCode: 401,
      message: 'Session token is required'
    })
  }
  return body.sessionToken
}