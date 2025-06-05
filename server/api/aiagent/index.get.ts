import { validateToken, getTokenFromEvent } from '~~/server/utils/aiagent/token'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Validate session token
    const sessionToken = await getTokenFromEvent(event)
    if (!config.jwtSecret) {
      throw new Error('JWT secret is not configured')
    }
    validateToken(sessionToken, { jwtSecret: config.jwtSecret as string }, event)

    // Return current session status
    return {
      status: 'active',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error validating AI agent session:', error)
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired session'
    })
  }
})
