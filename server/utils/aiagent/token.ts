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
  lastActivity: number
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

  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '2h' }) // Увеличиваем время жизни токена

  // Сохраняем информацию о сессии
  activeSessions.set(token, {
    deviceId,
    ip,
    userAgent,
    lastActivity: Date.now()
  })

  console.log('[Token] Generated new token:', { deviceId, ip, userAgent })
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
    let sessionData = activeSessions.get(token)
    if (!sessionData) {
      console.log('[Token] Session not found in active sessions, recreating session')
      
      // Если токен валидный, но сессия не найдена, создаем новую сессию
      const currentIP = getRequestIP(event) || 'unknown'
      const userAgent = getRequestHeader(event, 'user-agent') || 'unknown'
      
      sessionData = {
        deviceId: payload.deviceId,
        ip: currentIP,
        userAgent: userAgent,
        lastActivity: Date.now()
      }
      
      // Сохраняем новую сессию
      activeSessions.set(token, sessionData)
      console.log('[Token] Recreated session for valid token:', { deviceId: payload.deviceId, ip: currentIP })
    } else {
      // Обновляем время последней активности
      sessionData.lastActivity = Date.now()
    }

    // Проверяем IP (делаем более гибкой)
    const currentIP = getRequestIP(event) || 'unknown'
    const currentIPHash = hashIP(currentIP)
    
    // Разрешаем небольшие изменения в IP (например, при смене сети)
    if (currentIPHash !== payload.ipHash) {
      console.log('[Token] IP mismatch detected:', { 
        expected: payload.ipHash, 
        current: currentIPHash,
        expectedIP: sessionData.ip,
        currentIP: currentIP
      })
      
      // Если IP изменился, обновляем сессию
      sessionData.ip = currentIP
      payload.ipHash = currentIPHash
      console.log('[Token] Updated session with new IP')
    }

    // Проверяем устройство (делаем более гибкой)
    const userAgent = getRequestHeader(event, 'user-agent') || 'unknown'
    const currentDeviceId = generateDeviceId(userAgent, currentIP)
    
    if (currentDeviceId !== payload.deviceId) {
      console.log('[Token] Device mismatch detected:', { 
        expected: payload.deviceId, 
        current: currentDeviceId,
        expectedUserAgent: sessionData.userAgent,
        currentUserAgent: userAgent
      })
      
      // Если User-Agent изменился, обновляем сессию
      sessionData.userAgent = userAgent
      payload.deviceId = currentDeviceId
      console.log('[Token] Updated session with new User-Agent')
    }

    console.log('[Token] Token validation successful')
    return payload
  } catch (error) {
    console.error('[Token] Token validation failed:', error)
    throw createError({
      statusCode: 401,
      message: 'Invalid session token'
    })
  }
}

export const getTokenFromEvent = async (event: H3Event): Promise<string> => {
  try {
    // Сначала пробуем получить токен из заголовков
    const authHeader = getRequestHeader(event, 'authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      console.log('[Token] Found token in Authorization header')
      return token
    }

    // Затем пробуем получить из body
    const body = await readBody(event)
    if (body?.sessionToken) {
      console.log('[Token] Found token in request body')
      return body.sessionToken
    }

    // Проверяем query параметры
    const query = getQuery(event)
    if (query?.sessionToken) {
      console.log('[Token] Found token in query parameters')
      return query.sessionToken as string
    }

    console.log('[Token] No token found in request')
    throw createError({
      statusCode: 401,
      message: 'Session token is required'
    })
  } catch (error) {
    console.error('[Token] Error getting token from event:', error)
    throw createError({
      statusCode: 401,
      message: 'Session token is required'
    })
  }
}

// Функция для очистки старых сессий (можно вызывать периодически)
export const cleanupSessions = () => {
  const now = Date.now()
  let cleanedCount = 0
  
  for (const [token, sessionData] of activeSessions.entries()) {
    try {
      const decoded = jwt.decode(token) as TokenPayload
      // Удаляем сессии старше 2 часов или неактивные более 1 часа
      if (now - decoded.timestamp > 7200000 || now - sessionData.lastActivity > 3600000) {
        activeSessions.delete(token)
        cleanedCount++
        console.log('[Token] Cleaned up expired session:', token)
      }
    } catch {
      activeSessions.delete(token)
      cleanedCount++
      console.log('[Token] Cleaned up invalid session:', token)
    }
  }

  console.log('[Token] Cleanup completed. Removed sessions:', cleanedCount)
  return cleanedCount
}

// Функция для принудительного удаления сессии
export const removeSession = (token: string) => {
  if (activeSessions.has(token)) {
    activeSessions.delete(token)
    console.log('[Token] Manually removed session:', token)
    return true
  }
  return false
}