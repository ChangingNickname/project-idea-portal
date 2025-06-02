import { getFirestore } from 'firebase-admin/firestore'
import { checkAuth } from '~~/server/utils/auth'

interface ReadBy {
  userId: string
  timestamp: number
}

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
    const { messageIds } = body

    // Валидация тела запроса
    if (!messageIds || !Array.isArray(messageIds)) {
      throw createError({
        statusCode: 400,
        message: 'Массив ID сообщений обязателен'
      })
    }

    // Получаем сообщения для обновления
    const messagesRef = db.collection('messages')
      .where('from_user_id', '==', uid)
      .where('to_user_id', '==', authResult.currentUserId)

    const messages = await messagesRef.get()
    const batch = db.batch()
    let updatedCount = 0
    const now = new Date()

    // Обновляем каждое сообщение
    messages.forEach(doc => {
      if (messageIds.includes(doc.id)) {
        const data = doc.data()
        const read_by: ReadBy[] = data.read_by || []
        
        // Проверяем, не прочитано ли уже сообщение этим пользователем
        if (!read_by.some((reader: ReadBy) => reader.userId === authResult.currentUserId)) {
          read_by.push({
            userId: authResult.currentUserId,
            timestamp: now.getTime()
          })
        }

        batch.update(doc.ref, {
          read_at: now,
          updated_at: now,
          read_by,
          status: 'read'
        })
        updatedCount++
      }
    })

    // Применяем обновления
    if (updatedCount > 0) {
      await batch.commit()
    }

    return {
      updated: updatedCount
    }
  } catch (error) {
    console.error('Ошибка обновления статуса сообщений:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка обновления статуса сообщений'
    })
  }
})
