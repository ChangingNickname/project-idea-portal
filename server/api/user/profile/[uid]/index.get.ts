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
    const uid = event.context.params?.uid
    
    if (!uid || uid === 'undefined' || uid === 'null') {
      throw createError({
        statusCode: 400,
        message: 'Invalid user ID'
      })
    }

    // Get session cookie to check if user is authenticated
    const session = getCookie(event, 'session')
    let isAuthenticated = false
    let currentUserId = null

    if (session) {
      try {
        const decodedToken = await getAuth().verifySessionCookie(session, true)
        isAuthenticated = true
        currentUserId = decodedToken.uid
      } catch (error) {
        // Session is invalid, but we'll still return limited user data
        console.error('Session verification failed:', error)
      }
    }

    try {
      const userRecord = await getAuth().getUser(uid)

      // If user is requesting their own data or is authenticated, return full data
      if (isAuthenticated && currentUserId === uid) {
        return {
          id: userRecord.uid,
          email: userRecord.email,
          avatar: userRecord.photoURL,
          emailVerified: userRecord.emailVerified,
          displayName: userRecord.displayName,
          phoneNumber: userRecord.phoneNumber,
          disabled: userRecord.disabled,
          isAnonymous: userRecord.providerData.length === 0,
          providerData: userRecord.providerData.map(provider => ({
            providerId: provider.providerId,
            uid: provider.uid,
            displayName: provider.displayName,
            email: provider.email,
            phoneNumber: provider.phoneNumber,
            photoURL: provider.photoURL
          })),
          customClaims: userRecord.customClaims,
          metadata: {
            creationTime: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime,
            lastRefreshTime: userRecord.metadata.lastRefreshTime
          },
          tenantId: userRecord.tenantId,
          multiFactor: userRecord.multiFactor?.enrolledFactors?.map(factor => ({
            uid: factor.uid,
            factorId: factor.factorId,
            displayName: factor.displayName,
            enrollmentTime: factor.enrollmentTime
          }))
        }
      }

      // For other users, return only email and avatar
      return {
        id: userRecord.uid,
        email: userRecord.email,
        avatar: userRecord.photoURL
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw createError({
          statusCode: 404,
          message: 'User not found'
        })
      }
      throw error
    }
  } catch (error: any) {
    console.error('Error in /api/user/profile/[uid]:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal Server Error'
    })
  }
}) 