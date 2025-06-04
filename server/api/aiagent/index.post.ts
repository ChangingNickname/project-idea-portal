import { validateToken, getTokenFromEvent } from '../../utils/aiagent/token'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const body = await readBody(event)
    const { message, articleDraft, images } = body

    // Validate session token
    const sessionToken = await getTokenFromEvent(event)
    if (!config.jwtSecret) {
      throw new Error('JWT secret is not configured')
    }
    validateToken(sessionToken, { jwtSecret: config.jwtSecret as string }, event)

    // Log session info
    console.log('AI Agent Session:', {
      token: sessionToken,
      message,
      articleDraft,
      imagesCount: images?.length || 0
    })

    // Here you would typically:
    // 1. Process the message and article draft
    // 2. Call your AI service
    // 3. Return the response

    // Always return schema with current state
    const schema = {
      ...articleDraft,
      lastUpdated: new Date().toISOString(),
      message: message, // Include the current message in schema
      status: 'processed' // Add status to track processing state
    }

    // Log schema to console
    console.log('Article Schema:', JSON.stringify(schema, null, 2))

    return {
      answer: `Processed message: "${message}"`,
      schema
    }
  } catch (error) {
    console.error('Error processing AI agent message:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to process AI agent message'
    })
  }
}) 