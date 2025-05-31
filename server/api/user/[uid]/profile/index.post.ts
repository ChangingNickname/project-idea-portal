import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { defineEventHandler, getCookie, createError, readBody } from 'h3'

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

    // Проверяем аутентификацию
    const session = getCookie(event, 'session')
    if (!session) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }

    // Верифицируем сессию
    const decodedToken = await getAuth().verifySessionCookie(session, true)
    if (decodedToken.uid !== uid) {
      throw createError({
        statusCode: 403,
        message: 'Forbidden'
      })
    }

    // Получаем данные профиля из тела запроса
    const profileData = await readBody(event)
    
    // Валидация данных профиля
    if (!profileData.displayName) {
      throw createError({
        statusCode: 400,
        message: 'Display name is required'
      })
    }

    // Очищаем телефонные номера от форматирования
    const cleanPhoneNumber = (phone: string | null): string | null => {
      if (!phone) return null
      return phone.replace(/\D/g, '')
    }

    // Инициализируем Firestore
    const db = getFirestore()
    
    // Получаем текущего пользователя
    const userRecord = await getAuth().getUser(uid)
    
    // Создаем профиль пользователя
    const profileRef = db.collection('profiles').doc(uid)
    const profile = {
      id: uid,
      email: userRecord.email || null,
      avatar: profileData.avatar || userRecord.photoURL || null,
      emailVerified: userRecord.emailVerified,
      displayName: profileData.displayName,
      disabled: false,
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
      contacts: {
        email: userRecord.email || null,
        phone: cleanPhoneNumber(profileData.contacts?.phone) || null,
        telegram: profileData.contacts?.telegram || null,
        whatsapp: profileData.contacts?.whatsapp || null,
        viber: profileData.contacts?.viber || null,
        discord: profileData.contacts?.discord || null,
        linkedin: profileData.contacts?.linkedin || null,
        github: profileData.contacts?.github || null,
        website: profileData.contacts?.website || null
      },
      updatedAt: new Date().toISOString()
    }

    // Сохраняем профиль в Firestore
    await profileRef.set(profile, { merge: true })

    // Обновляем данные пользователя в Firebase Auth
    await getAuth().updateUser(uid, {
      displayName: profileData.displayName,
      photoURL: profileData.avatar || userRecord.photoURL
    })

    return {
      success: true,
      profile
    }

  } catch (error: any) {
    console.error('Error in /api/user/[uid]/profile POST:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal Server Error'
    })
  }
}) 