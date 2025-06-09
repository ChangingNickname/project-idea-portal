import { validateToken, getTokenFromEvent } from '~~/server/utils/aiagent/token'
import { ask } from '~~/server/utils/aiagent/model'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Validate session token
    const sessionToken = await getTokenFromEvent(event)
    if (!config.jwtSecret) {
      throw new Error('JWT secret is not configured')
    }
    validateToken(sessionToken, { jwtSecret: config.jwtSecret as string }, event)

    // Get request body
    const body = await readBody(event)
    const { message, articleDraft, messageHistory } = body

    if (!message) {
      throw createError({
        statusCode: 400,
        message: 'Message is required'
      })
    }

    // Process message and get response
    const result = await ask(message, articleDraft, messageHistory)

    // Log service information in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Service Information:', {
        taskOrder: result.taskOrder,
        userClarification: result.userClarification,
        featureInfo: result.featureInfo
      })
    }

    // Return only user-facing response
    return {
      answer: result.finalResponse,
      schema: result.schema || articleDraft // Return original schema if no changes
    }
  } catch (error) {
    console.error('Error processing AI agent message:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to process message'
    })
  }
}) 