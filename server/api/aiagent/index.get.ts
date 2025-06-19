import { validateToken, getTokenFromEvent } from '~~/server/utils/aiagent/token'
import { createValidatedChat } from '~~/server/utils/aiagent/model'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Validate session token
    let sessionToken: string
    try {
      sessionToken = await getTokenFromEvent(event)
    } catch (error) {
      console.error('[API] Failed to get session token:', error)
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        answer: "I'm having trouble processing your request right now. Please try again in a moment.",
        error: {
          type: 'session_error',
          message: 'Session token is required',
          details: 'Token not found in request',
          shouldReset: false
        }
      }
    }

    if (!config.jwtSecret) {
      console.error('[API] JWT secret is not configured')
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        answer: "I'm having trouble processing your request right now. Please try again in a moment.",
        error: {
          type: 'configuration_error',
          message: 'JWT secret is not configured',
          details: 'Server configuration is incomplete',
          shouldReset: false
        }
      }
    }

    try {
      validateToken(sessionToken, { jwtSecret: config.jwtSecret as string }, event)
    } catch (error) {
      console.error('[API] Token validation failed:', error)
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        answer: "I'm having trouble processing your request right now. Please try again in a moment.",
        error: {
          type: 'session_error',
          message: 'Invalid or expired session',
          details: error instanceof Error ? error.message : 'Unknown session error',
          shouldReset: false
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
    console.error('[API] Error validating AI agent session:', error)
    
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      answer: "I'm having trouble processing your request right now. Please try again in a moment.",
      error: {
        type: 'session_error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
        shouldReset: false
      }
    }
  }
})
