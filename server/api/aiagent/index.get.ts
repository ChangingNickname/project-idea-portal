import { validateToken, getTokenFromEvent } from '~~/server/utils/aiagent/token'
import { createValidatedChat } from '~~/server/utils/aiagent/model'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Validate session token
    const sessionToken = await getTokenFromEvent(event)
    if (!config.jwtSecret) {
      throw new Error('JWT secret is not configured')
    }
    validateToken(sessionToken, { jwtSecret: config.jwtSecret as string }, event)

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
      schema: articleDraft
    }
  } catch (error) {
    console.error('Error validating AI agent session:', error)
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired session'
    })
  }
})
