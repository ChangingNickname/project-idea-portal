import { cleanupSessions } from '~~/server/utils/aiagent/token'

export default defineEventHandler(async (event) => {
  try {
    const cleanedCount = cleanupSessions()
    
    return {
      success: true,
      message: `Cleaned up ${cleanedCount} expired sessions`,
      cleanedCount
    }
  } catch (error) {
    console.error('Error cleaning up AI agent sessions:', error)
    
    return {
      success: false,
      message: 'Failed to clean up sessions',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}) 