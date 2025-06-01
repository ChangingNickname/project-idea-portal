import { getFirestore } from 'firebase-admin/firestore'
import { checkAuth } from '~~/server/utils/auth'

const RELATION_STATUSES: readonly RelationStatus[] = ['friend', 'blacklist', 'pending_friend'] as const

export default defineEventHandler(async (event) => {
  const db = getFirestore()
  const uid = event.context.params?.uid

  // Проверяем авторизацию
  const authResult = await checkAuth(event)
  if (!authResult.isAuthenticated || !authResult.currentUserId) {
    throw createError({
      statusCode: 401,
      message: 'Требуется авторизация'
    })
  }

  try {
    // Получаем отношения в обоих направлениях
    const [relation1, relation2] = await Promise.all([
      // От текущего пользователя к целевому
      db.collection('relationships')
        .where('uid', '==', authResult.currentUserId)
        .where('targetUid', '==', uid)
        .limit(1)
        .get(),
      // От целевого пользователя к текущему
      db.collection('relationships')
        .where('uid', '==', uid)
        .where('targetUid', '==', authResult.currentUserId)
        .limit(1)
        .get()
    ])

    // Определяем статус отношений
    let status: RelationStatus | null = null

    // Проверяем черный список
    if (relation1.docs.some(doc => doc.data().status === 'blacklist') ||
        relation2.docs.some(doc => doc.data().status === 'blacklist')) {
      status = 'blacklist'
    }
    // Проверяем дружбу
    else if (relation1.docs.some(doc => doc.data().status === 'friend') &&
             relation2.docs.some(doc => doc.data().status === 'friend')) {
      status = 'friend'
    }
    // Проверяем ожидающие запросы
    else if (relation1.docs.some(doc => doc.data().status === 'pending_friend') ||
             relation2.docs.some(doc => doc.data().status === 'pending_friend')) {
      status = 'pending_friend'
    }

    return {
      status,
      relation1: relation1.docs[0]?.data() || null,
      relation2: relation2.docs[0]?.data() || null
    }
  } catch (error) {
    console.error('Ошибка получения статуса отношений:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка получения статуса отношений'
    })
  }
})
