import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { defineEventHandler, getCookie, createError } from 'h3'

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

export default defineEventHandler(async (event): Promise<User> => {
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
      const db = getFirestore()
      
      // Получаем профиль пользователя из Firestore
      const profileDoc = await db.collection('profiles').doc(uid).get()
      const profileData = profileDoc.exists ? profileDoc.data() : null

      // If user is requesting their own data or is authenticated, return full data
      if (isAuthenticated && currentUserId === uid) {
        return {
          id: userRecord.uid,
          email: userRecord.email || null,
          avatar: profileData?.avatar || userRecord.photoURL || null,
          emailVerified: userRecord.emailVerified,
          displayName: profileData?.displayName || userRecord.displayName || null,          disabled: userRecord.disabled,
          isAnonymous: userRecord.providerData.length === 0,
          providerData: userRecord.providerData.map(provider => ({
            providerId: provider.providerId,
            uid: provider.uid,
            displayName: provider.displayName || null,
            email: provider.email || null,
            phoneNumber: provider.phoneNumber || null,
            photoURL: provider.photoURL || null
          })),
          customClaims: userRecord.customClaims || null,
          metadata: {
            creationTime: userRecord.metadata.creationTime || null,
            lastSignInTime: userRecord.metadata.lastSignInTime || null,
            lastRefreshTime: userRecord.metadata.lastRefreshTime || null
          },
          tenantId: userRecord.tenantId || null,
          multiFactor: userRecord.multiFactor ? {
            enrolledFactors: userRecord.multiFactor.enrolledFactors.map(factor => ({
              uid: factor.uid,
              factorId: factor.factorId,
              displayName: factor.displayName || null,
              enrollmentTime: factor.enrollmentTime || null
            }))
          } : null,
          contacts: profileData?.contacts || {
            email: userRecord.email || null,
            phone: userRecord.phoneNumber || null,
            telegram: null,
            whatsapp: null,
            viber: null,
            discord: null,
            linkedin: null,
            github: null,
            website: null
          }
        }
      }

      // For other users, return only public data
      return {
        id: userRecord.uid,
        email: null,
        avatar: profileData?.avatar || userRecord.photoURL || null,
        emailVerified: false,
        displayName: profileData?.displayName || userRecord.displayName || userRecord.email || null,
        disabled: false,
        isAnonymous: false,
        providerData: [],
        customClaims: null,
        metadata: {
          creationTime: null,
          lastSignInTime: null,
          lastRefreshTime: null
        },
        tenantId: null,
        multiFactor: null,
        contacts: {
          email: null,
          phone: null,
          telegram: null,
          whatsapp: null,
          viber: null,
          discord: null,
          linkedin: null,
          github: null,
          website: null
        }
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw createError({
          statusCode: 404,
          message: 'User not found'
        })
      }
      throw createError({
        statusCode: 500,
        message: error.message || 'Failed to get user data'
      })
    }
  } catch (error: any) {
    console.error('Error in /api/user/profile/[uid]:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal Server Error'
    })
  }
}) 