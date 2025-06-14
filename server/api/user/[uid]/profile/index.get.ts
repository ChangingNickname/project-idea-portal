import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { defineEventHandler, createError } from 'h3'
import { checkAuth } from '~~/server/utils/auth'

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
        message: 'Неверный ID пользователя'
      })
    }

    // Проверяем авторизацию
    const authResult = await checkAuth(event)
    const isAuthenticated = authResult.isAuthenticated
    const currentUserId = authResult.currentUserId

    try {
      const userRecord = await getAuth().getUser(uid)
      const db = getFirestore()
      
      // Получаем профиль пользователя из Firestore
      const profileDoc = await db.collection('profiles').doc(uid).get()
      const profileData = profileDoc.exists ? profileDoc.data() : null

      // Получаем base64 аватар только из Firestore
      const avatarBase64 = profileData?.avatar || null

      // Проверяем, добавил ли пользователь меня в друзья
      let isAddedToFriends = false
      if (isAuthenticated && currentUserId) {
        const relationshipDoc = await db.collection('relationships')
          .where('uid', '==', uid)
          .where('targetUid', '==', currentUserId)
          .where('status', '==', 'friend')
          .get()
        isAddedToFriends = !relationshipDoc.empty
      }

      console.log('isAddedToFriends', isAddedToFriends)

      // Если пользователь запрашивает свои данные или добавил меня в друзья, возвращаем полные данные
      if (isAuthenticated && (currentUserId === uid || isAddedToFriends)) {
        console.log('userRecord', userRecord)
        console.log('avatarBase64', avatarBase64)
        return {
          id: userRecord.uid,
          email: userRecord.email || null,
          avatar: avatarBase64,
          emailVerified: userRecord.emailVerified,
          displayName: profileData?.displayName || userRecord.displayName || null,
          position: profileData?.position || null,
          disabled: userRecord.disabled,
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

      // Для других пользователей возвращаем только публичные данные
      return {
        id: userRecord.uid,
        email: null,
        avatar: avatarBase64,
        emailVerified: false,
        displayName: profileData?.displayName || userRecord.displayName || userRecord.email || null,
        position: profileData?.position || null,
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
          message: 'Пользователь не найден'
        })
      }
      throw createError({
        statusCode: 500,
        message: error.message || 'Ошибка при получении данных пользователя'
      })
    }
  } catch (error: any) {
    console.error('Ошибка в /api/user/[uid]/profile:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Внутренняя ошибка сервера'
    })
  }
}) 