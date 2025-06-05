import jwt from 'jsonwebtoken'
import { H3Event } from 'h3'
import { readBody } from 'h3'
import { getRequestIP } from 'h3'
import { getRequestHeader } from 'h3'
import crypto from 'crypto'

export interface TokenPayload {
  type: 'ai-agent-session'
  timestamp: number
  deviceId: string
  ipHash: string
}

interface SessionData {
  deviceId: string
  ip: string
  userAgent: string
}

// Хранилище активных сессий (в реальном приложении лучше использовать Redis или другое хранилище)
const activeSessions = new Map<string, SessionData>()

export const generateDeviceId = (userAgent: string, ip: string): string => {
  return crypto
    .createHash('sha256')
    .update(`${userAgent}${ip}`)
    .digest('hex')
}

export const hashIP = (ip: string): string => {
  return crypto
    .createHash('sha256')
    .update(ip)
    .digest('hex')
}

export const generateToken = (config: { jwtSecret: string }, event: H3Event): string => {
  if (!config.jwtSecret || typeof config.jwtSecret !== 'string') {
    throw createError({
      statusCode: 500,
      message: 'JWT secret is not properly configured'
    })
  }

  const ip = getRequestIP(event) || 'unknown'
  const userAgent = getRequestHeader(event, 'user-agent') || 'unknown'
  const deviceId = generateDeviceId(userAgent, ip)
  const ipHash = hashIP(ip)

  const payload: TokenPayload = {
    type: 'ai-agent-session',
    timestamp: Date.now(),
    deviceId,
    ipHash
  }

  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' })

  // Сохраняем информацию о сессии
  activeSessions.set(token, {
    deviceId,
    ip,
    userAgent
  })

  return token
}

export const validateToken = (token: string, config: { jwtSecret: string }, event: H3Event): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    
    if (typeof decoded === 'string') {
      throw new Error('Invalid token format')
    }

    const payload = decoded as TokenPayload
    if (payload.type !== 'ai-agent-session') {
      throw new Error('Invalid token type')
    }

    // Проверяем, существует ли сессия
    const sessionData = activeSessions.get(token)
    if (!sessionData) {
      throw new Error('Session not found')
    }

    // Проверяем IP
    const currentIP = getRequestIP(event) || 'unknown'
    const currentIPHash = hashIP(currentIP)
    if (currentIPHash !== payload.ipHash) {
      throw new Error('IP mismatch')
    }

    // Проверяем устройство
    const userAgent = getRequestHeader(event, 'user-agent') || 'unknown'
    const currentDeviceId = generateDeviceId(userAgent, currentIP)
    if (currentDeviceId !== payload.deviceId) {
      throw new Error('Device mismatch')
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

// Функция для очистки старых сессий (можно вызывать периодически)
export const cleanupSessions = () => {
  const now = Date.now()
  for (const [token, sessionData] of activeSessions.entries()) {
    try {
      const decoded = jwt.decode(token) as TokenPayload
      if (now - decoded.timestamp > 3600000) { // 1 час
        activeSessions.delete(token)
      }
    } catch {
      activeSessions.delete(token)
    }
  }
}