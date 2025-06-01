import { getFirestore } from 'firebase-admin/firestore'
import { checkAuth } from '~~/server/utils/auth'

const RELATION_STATUSES: readonly RelationStatus[] = ['friend', 'blacklist'] as const

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
    // Получаем отношение от текущего пользователя к целевому
    const relation = await db.collection('relationships')
      .where('uid', '==', authResult.currentUserId)
      .where('targetUid', '==', uid)
      .where('status', 'in', RELATION_STATUSES)
      .limit(1)
      .get()

    console.log('Relation found:', relation.docs.map(doc => doc.data()))

    // Определяем статус отношений
    const status: RelationStatus | null = relation.docs[0]?.data().status || null

    console.log('Final status:', status)

    return { status }
  } catch (error) {
    console.error('Ошибка получения статуса отношений:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка получения статуса отношений'
    })
  }
})
