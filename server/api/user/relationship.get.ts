import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { checkAuth } from '~~/server/utils/auth'

const RELATION_STATUSES: readonly RelationStatus[] = ['friend', 'blacklist'] as const

export default defineEventHandler(async (event) => {
  const db = getFirestore()
  const auth = getAuth()

  // Проверяем авторизацию
  const authResult = await checkAuth(event)
  if (!authResult.isAuthenticated || !authResult.currentUserId) {
    throw createError({
      statusCode: 401,
      message: 'Требуется авторизация'
    })
  }

  try {
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10
    const status = query.status as string | undefined
    const type = query.type as 'friends' | 'blocked' | undefined

    console.log('Current user ID:', authResult.currentUserId)

    // Базовый запрос
    let relationshipsQuery = db.collection('relationships')
      .where('uid', '==', authResult.currentUserId)

    // Фильтрация по статусу
    if (status) {
      relationshipsQuery = relationshipsQuery.where('status', '==', status)
    }

    // Фильтрация по типу
    if (type === 'friends') {
      relationshipsQuery = relationshipsQuery.where('status', '==', 'friend')
    } else if (type === 'blocked') {
      relationshipsQuery = relationshipsQuery.where('status', '==', 'blacklist')
    }

    // Получаем общее количество
    const totalSnapshot = await relationshipsQuery.count().get()
    const total = totalSnapshot.data().count

    console.log('Total relationships found:', total)

    // Если нет записей, возвращаем пустой результат
    if (total === 0) {
      return {
        relationships: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0
        }
      }
    }

    // Получаем данные с пагинацией
    const snapshot = await relationshipsQuery
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset((page - 1) * limit)
      .get()

    console.log('Relationships found:', snapshot.docs.map(doc => doc.data()))

    // Получаем ID пользователей
    const userIds = snapshot.docs.map((doc: any) => doc.data().targetUid)

    console.log('Target user IDs:', userIds)

    // Если нет ID пользователей, возвращаем пустой результат
    if (userIds.length === 0) {
      return {
        relationships: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0
        }
      }
    }

    // Получаем профили пользователей
    const profilesSnapshot = await db.collection('profiles')
      .where('uid', 'in', userIds)
      .get()

    console.log('Profiles found:', profilesSnapshot.docs.map(doc => doc.data()))

    // Создаем мапу профилей
    const profilesMap = new Map(
      profilesSnapshot.docs.map((doc: any) => [doc.data().uid, doc.data()])
    )

    // Получаем данные пользователей из Firebase Auth
    const userRecords = await Promise.all(
      userIds.map(async (uid) => {
        try {
          return await auth.getUser(uid)
        } catch (error) {
          console.error(`Error fetching user ${uid}:`, error)
          return null
        }
      })
    )

    // Создаем мапу пользователей
    const usersMap = new Map(
      userRecords
        .filter((user): user is NonNullable<typeof user> => user !== null)
        .map(user => [
          user.uid,
          {
            id: user.uid,
            email: user.email || null,
            avatar: user.photoURL || null,
            emailVerified: user.emailVerified,
            displayName: user.displayName || null,
            disabled: user.disabled,
            isAnonymous: user.providerData.length === 0,
            providerData: user.providerData.map(provider => ({
              providerId: provider.providerId,
              uid: provider.uid,
              displayName: provider.displayName || null,
              email: provider.email || null,
              phoneNumber: provider.phoneNumber || null,
              photoURL: provider.photoURL || null
            })),
            customClaims: user.customClaims || null,
            metadata: {
              creationTime: user.metadata.creationTime || null,
              lastSignInTime: user.metadata.lastSignInTime || null,
              lastRefreshTime: user.metadata.lastRefreshTime || null
            },
            tenantId: user.tenantId || null,
            multiFactor: user.multiFactor ? {
              enrolledFactors: user.multiFactor.enrolledFactors.map(factor => ({
                uid: factor.uid,
                factorId: factor.factorId,
                displayName: factor.displayName || null,
                enrollmentTime: factor.enrollmentTime || null
              }))
            } : null,
            contacts: profilesMap.get(user.uid)?.contacts || {
              email: user.email || null,
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
        ])
    )

    // Формируем результат
    const relationships = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        user: usersMap.get(data.targetUid) || null
      }
    })

    console.log('Final relationships:', relationships)

    return {
      relationships,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    console.error('Ошибка получения списка отношений:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Внутренняя ошибка сервера'
    })
  }
}) 