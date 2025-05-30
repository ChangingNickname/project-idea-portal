import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { defineEventHandler, getCookie, setCookie } from 'h3'

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

  if (sessionCookie) {
    try {
      // Verify the session cookie
      const decodedClaims = await getAuth().verifySessionCookie(sessionCookie)
      
      // Revoke all refresh tokens for the user
      await getAuth().revokeRefreshTokens(decodedClaims.sub)
    } catch (error) {
      console.error('Error revoking tokens:', error)
    }
  }

  // Clear the session cookie
  setCookie(event, 'session', '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })

  return { success: true }
}) 