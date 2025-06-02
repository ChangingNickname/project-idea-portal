import { getFirestore } from 'firebase-admin/firestore'
import { checkAuth } from '~~/server/utils/auth'

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
    const { message, type = 'text', metadata = {} } = body

    // Валидация тела запроса
    if (!message) {
      throw createError({
        statusCode: 400,
        message: 'Текст сообщения обязателен'
      })
    }

    // Создаем новое сообщение
    const messageRef = await db.collection('messages').add({
      from_user_id: authResult.currentUserId,
      to_user_id: uid,
      message,
      type,
      metadata,
      created_at: new Date(),
      updated_at: new Date(),
      read_at: null,
      read_by: [],
      status: 'sent'
    })

    // Получаем созданное сообщение
    const messageDoc = await messageRef.get()
    const messageData = messageDoc.data()

    return {
      id: messageDoc.id,
      ...messageData
    }
  } catch (error) {
    console.error('Ошибка создания сообщения:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка создания сообщения'
    })
  }
})
