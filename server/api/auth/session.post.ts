import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { defineEventHandler, readBody, setCookie } from 'h3'

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

    // Verify the token
    const decodedToken = await getAuth().verifyIdToken(token)
    
    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
    const sessionCookie = await getAuth().createSessionCookie(token, { expiresIn })
    
    // Set the cookie
    setCookie(event, 'session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    })

    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified
      }
    }
  } catch (error: any) {
    console.error('Error creating session:', error)
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }
}) 