import { validateToken, getTokenFromEvent } from '~~/server/utils/aiagent/token'
import { ask } from '~~/server/utils/aiagent/model'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Validate session token
    let sessionToken: string
    try {
      sessionToken = await getTokenFromEvent(event)
    } catch (error) {
      console.error('[API] Failed to get session token:', error)
      // Return user-friendly message instead of technical error
      return {
        answer: "I'm having trouble processing your message right now. Please try again in a moment.",
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
        answer: "I'm having trouble processing your message right now. Please try again in a moment.",
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
      // Return user-friendly message instead of technical error
      return {
        answer: "I'm having trouble processing your message right now. Please try again in a moment.",
        error: {
          type: 'session_error',
          message: 'Invalid or expired session',
          details: error instanceof Error ? error.message : 'Unknown session error',
          shouldReset: false
        }
      }
    }

    // Get request body
    let body: any
    try {
      body = await readBody(event)
    } catch (error) {
      console.error('[API] Failed to read request body:', error)
      return {
        answer: "I'm having trouble processing your message right now. Please try again in a moment.",
        error: {
          type: 'request_error',
          message: 'Failed to read request body',
          details: error instanceof Error ? error.message : 'Unknown request error',
          shouldReset: false
        }
      }
    }

    const { message, articleDraft, messageHistory } = body

    if (!message) {
      return {
        answer: "I need a message to help you. Please provide your question or request.",
        error: {
          type: 'validation_error',
          message: 'Message is required',
          details: 'Request body is missing required field: message',
          shouldReset: false
        }
      }
    }

    // Process message and get response with automatic retry
    let result
    try {
      result = await ask(message, articleDraft, messageHistory)
    } catch (error) {
      console.error('[API] Error in ask function:', error)
      
      // If it's a session-related error, try to recreate and retry once
      if (error instanceof Error && (
        error.message.includes('Session not found') || 
        error.message.includes('chat_creation_error')
      )) {
        console.log('[API] Session error detected, attempting to recreate and retry')
        try {
          // Wait a moment for session recreation
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Retry the request
          result = await ask(message, articleDraft, messageHistory)
          console.log('[API] Successfully retried after session recreation')
        } catch (retryError) {
          console.error('[API] Retry failed:', retryError)
          return {
            answer: "I'm having trouble processing your message right now. Please try again in a moment.",
            error: {
              type: 'processing_error',
              message: 'Failed to process message after retry',
              details: retryError instanceof Error ? retryError.message : 'Unknown retry error',
              shouldReset: false
            }
          }
        }
      } else {
        throw error
      }
    }

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
    console.error('[API] Error processing AI agent message:', error)
    
    // Return user-friendly message instead of technical error
    return {
      answer: "I'm having trouble processing your message right now. Please try again in a moment.",
      error: {
        type: 'processing_error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
        shouldReset: false
      }
    }
  }
}) 