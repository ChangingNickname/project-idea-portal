import { validateToken, getTokenFromEvent } from '~~/server/utils/aiagent/token'
import { ask } from '~~/server/utils/aiagent/model'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Validate session token
    const sessionToken = await getTokenFromEvent(event)
    if (!config.jwtSecret) {
      return {
        answer: 'Произошла ошибка конфигурации сервера. Пожалуйста, сбросьте чат. Если проблема повторяется, обратитесь к администратору.',
        error: {
          type: 'configuration_error',
          message: 'JWT secret is not configured',
          details: 'Server configuration is incomplete',
          shouldReset: true
        }
      }
    }

    try {
      validateToken(sessionToken, { jwtSecret: config.jwtSecret as string }, event)
    } catch (error) {
      return {
        answer: 'Произошла ошибка сессии. Пожалуйста, сбросьте чат. Если проблема повторяется, обратитесь к администратору.',
        error: {
          type: 'session_error',
          message: 'Invalid or expired session',
          details: error instanceof Error ? error.message : 'Unknown session error',
          shouldReset: true
        }
      }
    }

    // Get request body
    const body = await readBody(event)
    const { message, articleDraft, messageHistory } = body

    if (!message) {
      return {
        answer: 'Ошибка валидации: сообщение обязательно',
        error: {
          type: 'validation_error',
          message: 'Message is required',
          details: 'Request body is missing required field: message',
          shouldReset: false
        }
      }
    }

    // Process message and get response
    const result = await ask(message, articleDraft, messageHistory)

    // Log service information in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Service Information:', {
        taskOrder: result.taskOrder,
        userClarification: result.userClarification,
        featureInfo: result.featureInfo,
        error: result.error
      })
    }

    // Return response with error information if present
    return {
      answer: result.finalResponse,
      schema: result.schema || articleDraft, // Return original schema if no changes
      error: result.error
    }
  } catch (error) {
    console.error('Error processing AI agent message:', error)
    
    return {
      answer: 'Произошла ошибка при обработке сообщения. Пожалуйста, сбросьте чат. Если проблема повторяется, обратитесь к администратору.',
      error: {
        type: 'processing_error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
        shouldReset: true
      }
    }
  }
}) 