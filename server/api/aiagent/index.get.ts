import { validateToken, getTokenFromEvent } from '../../utils/aiagent/token'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const body = await readBody(event)
    const { message, articleDraft } = body

    // Validate session token
    const sessionToken = await getTokenFromEvent(event)
    validateToken(sessionToken, { jwtSecret: config.jwtSecret as string })

    // Here you would typically:
    // 1. Process the message and article draft
    // 2. Call your AI service
    // 3. Return the response

    // For now, returning a mock response
    return {
      response: `Processed message: "${message}" with article draft: ${JSON.stringify(articleDraft)}`
    }
  } catch (error) {
    console.error('Error processing AI agent message:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to process AI agent message'
    })
  }
})
