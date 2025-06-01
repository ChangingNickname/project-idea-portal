import { defineEventHandler } from 'h3'
import { checkAuth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const authResult = await checkAuth(event)
  return authResult
})
