import { generateToken } from '../../utils/aiagent/token'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    if (!config.jwtSecret) {
      throw new Error('JWT secret is not configured')
    }

    const token = generateToken({ jwtSecret: config.jwtSecret as string }, event)

    return {
      token
    }
  } catch (error) {
    console.error('Error generating AI agent token:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to generate AI agent token'
    })
  }
})
