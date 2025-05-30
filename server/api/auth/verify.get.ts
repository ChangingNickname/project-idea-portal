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
  const sessionCookie = getCookie(event, 'session')

  if (!sessionCookie) {
    throw createError({
      statusCode: 401,
      message: 'No session found'
    })
  }

  try {
    const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true)
    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      emailVerified: decodedClaims.email_verified
    }
  } catch (error) {
    console.error('Error verifying session:', error)
    throw createError({
      statusCode: 401,
      message: 'Invalid session'
    })
  }
}) 