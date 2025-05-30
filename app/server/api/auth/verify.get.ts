import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { defineEventHandler, getCookie } from 'h3'

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  })
}

export default defineEventHandler(async (event) => {
  try {
    const session = getCookie(event, 'session')
    
    if (!session) {
      throw createError({
        statusCode: 401,
        message: 'No session'
      })
    }

    // Verify the session cookie
    await getAuth().verifySessionCookie(session, true)
    return { status: 'success' }
  } catch (error) {
    console.error('Verify error:', error)
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }
}) 