import { validateToken, getTokenFromEvent } from '~~/server/utils/aiagent/token'
import { createValidatedChat } from '~~/server/utils/aiagent/model'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Validate session token
    const sessionToken = await getTokenFromEvent(event)
    if (!config.jwtSecret) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
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
        status: 'error',
        timestamp: new Date().toISOString(),
        answer: 'Произошла ошибка сессии. Пожалуйста, сбросьте чат. Если проблема повторяется, обратитесь к администратору.',
        error: {
          type: 'session_error',
          message: 'Invalid or expired session',
          details: error instanceof Error ? error.message : 'Unknown session error',
          shouldReset: true
        }
      }
    }

    // Get chat session
    const chat = await createValidatedChat(event)
    
    // Get last message and article draft
    const lastMessage = chat.messages[chat.messages.length - 1]
    const articleDraft = lastMessage?.schema || null

    // Return current session status and article draft
    return {
      status: 'active',
      timestamp: new Date().toISOString(),
      answer: lastMessage?.content || '',
      schema: articleDraft,
      error: lastMessage?.error
    }
  } catch (error) {
    console.error('Error validating AI agent session:', error)
    
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      answer: 'Произошла ошибка при обработке запроса. Пожалуйста, сбросьте чат. Если проблема повторяется, обратитесь к администратору.',
      error: {
        type: 'session_error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
        shouldReset: true
      }
    }
  }
})
