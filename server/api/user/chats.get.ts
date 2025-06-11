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
    // Получаем параметры запроса
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 20
    const search = (query.search as string) || ''
    const sortBy = (query.sortBy as string) || 'lastMessage'
    const sortDirection = (query.sortDirection as 'asc' | 'desc') || 'desc'

    // Получаем все сообщения, где текущий пользователь является отправителем или получателем
    const sentMessagesRef = db.collection('messages')
      .where('from_user_id', '==', authResult.currentUserId)
      .orderBy('created_at', 'desc')

    const receivedMessagesRef = db.collection('messages')
      .where('to_user_id', '==', authResult.currentUserId)
      .orderBy('created_at', 'desc')

    const [sentMessages, receivedMessages] = await Promise.all([
      sentMessagesRef.get(),
      receivedMessagesRef.get()
    ])
    
    // Собираем уникальных пользователей и их последние сообщения
    const chatMap = new Map()
    
    // Process sent messages
    sentMessages.forEach(doc => {
      const data = doc.data()
      const otherUserId = data.to_user_id

      if (!chatMap.has(otherUserId) || 
          new Date(data.created_at.toDate()) > new Date(chatMap.get(otherUserId).lastMessage.created_at)) {
        chatMap.set(otherUserId, {
          lastMessage: {
            id: doc.id,
            message: data.message,
            created_at: data.created_at.toDate().toISOString()
          }
        })
      }
    })

    // Process received messages
    receivedMessages.forEach(doc => {
      const data = doc.data()
      const otherUserId = data.from_user_id

      if (!chatMap.has(otherUserId) || 
          new Date(data.created_at.toDate()) > new Date(chatMap.get(otherUserId).lastMessage.created_at)) {
        chatMap.set(otherUserId, {
          lastMessage: {
            id: doc.id,
            message: data.message,
            created_at: data.created_at.toDate().toISOString()
          }
        })
      }
    })

    // Получаем информацию о пользователях
    const chats = await Promise.all(
      Array.from(chatMap.entries()).map(async ([userId, chatData]) => {
        const userDoc = await db.collection('users').doc(userId).get()
        const userData = userDoc.data()

        return {
          userId,
          user: {
            id: userId,
            email: userData?.email || '',
            displayName: userData?.displayName || null,
            avatar: userData?.avatar || null,
            emailVerified: userData?.emailVerified || false
          },
          lastMessage: chatData.lastMessage
        }
      })
    )

    // Фильтрация по поиску
    let filteredChats = chats
    if (search) {
      const searchLower = search.toLowerCase()
      filteredChats = chats.filter(chat => 
        chat.user.displayName?.toLowerCase().includes(searchLower) ||
        chat.user.email.toLowerCase().includes(searchLower)
      )
    }

    // Сортировка
    filteredChats.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = (a.user.displayName || a.user.email)
            .localeCompare(b.user.displayName || b.user.email)
          break
        case 'email':
          comparison = a.user.email.localeCompare(b.user.email)
          break
        case 'lastMessage':
        default:
          const dateA = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0
          const dateB = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0
          comparison = dateB - dateA
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    // Пагинация
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedChats = filteredChats.slice(start, end)

    return {
      chats: paginatedChats,
      pagination: {
        total: filteredChats.length,
        page,
        limit,
        pages: Math.ceil(filteredChats.length / limit)
      }
    }
  } catch (error) {
    console.error('Ошибка получения списка чатов:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка получения списка чатов'
    })
  }
}) 