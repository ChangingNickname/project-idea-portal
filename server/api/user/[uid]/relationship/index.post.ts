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
    const body = await readBody(event)
    const { status } = body as { status: RelationStatus | null }

    // Получаем текущие отношения
    const relationRef = db.collection('relationships')
      .where('uid', '==', authResult.currentUserId)
      .where('targetUid', '==', uid)
      .limit(1)

    const relation = await relationRef.get()

    if (status === null) {
      // Если статус null, удаляем запись
      if (!relation.empty) {
        await relation.docs[0].ref.delete()
      }
      return {
        success: true,
        message: 'Отношения удалены'
      }
    }

    if (!RELATION_STATUSES.includes(status)) {
      throw createError({
        statusCode: 400,
        message: 'Неверный статус отношений'
      })
    }

    if (relation.empty) {
      // Создаем новые отношения
      await db.collection('relationships').add({
        uid: authResult.currentUserId,
        targetUid: uid,
        status,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } else {
      // Обновляем существующие отношения
      const doc = relation.docs[0]
      if (!doc) {
        throw createError({
          statusCode: 500,
          message: 'Ошибка обновления отношений'
        })
      }
      await doc.ref.update({
        status,
        updatedAt: new Date()
      })
    }

    return {
      success: true,
      message: 'Статус отношений обновлен'
    }
  } catch (error) {
    console.error('Ошибка обновления статуса отношений:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка обновления статуса отношений'
    })
  }
})
