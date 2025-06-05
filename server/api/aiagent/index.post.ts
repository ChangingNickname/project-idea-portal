import { ask } from '~~/server/utils/aiagent/model'
import { H3Error } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    if (!body?.message) {
      throw createError({
        statusCode: 400,
        message: 'Message is required'
      })
    }

    const { text, schema } = await ask(body.message, event, body.articleDraft)
    return { 
      answer: text,
      schema: schema || body.articleDraft || null
    }
  } catch (error) {
    console.error('Error in AI agent request:', error)
    const h3Error = error as H3Error
    throw createError({
      statusCode: h3Error.statusCode || 500,
      message: h3Error.message || 'Internal server error'
    })
  }
}) 