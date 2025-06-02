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
    // Получаем сообщения между двумя пользователями
    const messagesRef = db.collection('messages')
      .where('from_user_id', 'in', [uid, authResult.currentUserId])
      .where('to_user_id', 'in', [uid, authResult.currentUserId])
      .orderBy('created_at', 'asc')

    const messages = await messagesRef.get()
    
    // Преобразуем сообщения в нужный формат
    const formattedMessages = messages.docs.map(doc => {
      const data = doc.data()
      // Получаем timestamp из Firestore Timestamp
      const created_at = data.created_at?.toDate?.() || new Date()
      const updated_at = data.updated_at?.toDate?.() || created_at
      
      return {
        id: doc.id,
        from_user_id: data.from_user_id,
        to_user_id: data.to_user_id,
        message: data.message,
        type: data.type || 'text',
        metadata: data.metadata || {},
        created_at: created_at.toISOString(),
        updated_at: updated_at.toISOString(),
        read_at: data.read_at?.toDate?.()?.toISOString() || null,
        read_by: data.read_by || [],
        status: data.status || 'sent',
        timestamp: created_at.getTime()
      }
    })

    return formattedMessages
  } catch (error) {
    console.error('Ошибка получения сообщений:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка получения сообщений'
    })
  }
}) 