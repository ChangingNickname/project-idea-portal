import { cleanupSessions } from '../utils/aiagent/token'

let lastCleanup = 0
const CLEANUP_INTERVAL = 30 * 60 * 1000 // 30 minutes

export default defineEventHandler(async (event) => {
  const now = Date.now()
  
  // Run cleanup every 30 minutes
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    try {
      console.log('[Middleware] Running AI agent session cleanup')
      const cleanedCount = cleanupSessions()
      console.log(`[Middleware] Cleaned up ${cleanedCount} expired AI agent sessions`)
      lastCleanup = now
    } catch (error) {
      console.error('[Middleware] Error during AI agent session cleanup:', error)
    }
  }
}) 