import { getFirestore } from 'firebase-admin/firestore'
import { checkAuth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const db = getFirestore()

  // Проверяем авторизацию
  const authResult = await checkAuth(event)
  if (!authResult.isAuthenticated || !authResult.currentUserId) {
    throw createError({
      statusCode: 401,
      message: 'Требуется авторизация'
    })
  }

  try {
    // Получаем все непрочитанные сообщения для текущего пользователя
    const messagesRef = db.collection('messages')
      .where('to_user_id', '==', authResult.currentUserId)
      .where('read_at', '==', null)

    const messages = await messagesRef.get()
    
    // Группируем сообщения по отправителю
    const unreadCounts: { [userId: string]: number } = {}
    
    messages.forEach(doc => {
      const data = doc.data()
      const fromUserId = data.from_user_id
      
      if (!unreadCounts[fromUserId]) {
        unreadCounts[fromUserId] = 0
      }
      
      unreadCounts[fromUserId]++
    })

    return unreadCounts
  } catch (error) {
    console.error('Ошибка получения непрочитанных сообщений:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка получения непрочитанных сообщений'
    })
  }
}) 