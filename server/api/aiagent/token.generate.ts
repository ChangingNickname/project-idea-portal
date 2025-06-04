import { generateToken } from '../../utils/aiagent/token'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const token = generateToken({ jwtSecret: config.jwtSecret as string })
    
    return {
      token
    }
  } catch (error) {
    console.error('Error generating AI agent token:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to generate AI agent session token'
    })
  }
})
