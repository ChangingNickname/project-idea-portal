import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { defineEventHandler, readBody } from 'h3'

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
    const { token } = await readBody(event)

    if (!token) {
      throw createError({
        statusCode: 400,
        message: 'Token is required'
      })
    }

    // Verify the ID token
    await getAuth().verifyIdToken(token)
    return { valid: true }
  } catch (error) {
    console.error('Token verification failed:', error)
    throw createError({
      statusCode: 401,
      message: 'Invalid token'
    })
  }
}) 