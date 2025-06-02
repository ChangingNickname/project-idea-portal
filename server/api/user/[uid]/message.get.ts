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
    // Получаем количество непрочитанных сообщений
    const messagesRef = db.collection('messages')
      .where('from_user_id', '==', uid)
      .where('to_user_id', '==', authResult.currentUserId)
      .where('read_at', '==', null)

    const messages = await messagesRef.get()

    return {
      count: messages.size
    }
  } catch (error) {
    console.error('Ошибка получения количества сообщений:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка получения количества сообщений'
    })
  }
})
