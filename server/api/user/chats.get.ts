import { getFirestore } from 'firebase-admin/firestore'
import { checkAuth } from '~~/server/utils/auth'
import { getAuth } from 'firebase-admin/auth'

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
        try {
          const userRecord = await getAuth().getUser(userId)
          const profileDoc = await db.collection('profiles').doc(userId).get()
          const profileData = profileDoc.exists ? profileDoc.data() : null

          // Проверяем, добавил ли пользователь меня в друзья
          let isAddedToFriends = false
          if (authResult.currentUserId) {
            const relationshipDoc = await db.collection('relationships')
              .where('uid', '==', userId)
              .where('targetUid', '==', authResult.currentUserId)
              .where('status', '==', 'friend')
              .get()
            isAddedToFriends = !relationshipDoc.empty
          }

          // Если пользователь запрашивает свои данные или добавил меня в друзья, возвращаем полные данные
          const user = authResult.currentUserId === userId || isAddedToFriends ? {
            id: userRecord.uid,
            email: userRecord.email || null,
            avatar: profileData?.avatar || userRecord.photoURL || null,
            emailVerified: userRecord.emailVerified,
            displayName: profileData?.displayName || userRecord.displayName || null,
            position: profileData?.position || null,
            disabled: userRecord.disabled,
            isAnonymous: userRecord.providerData.length === 0,
            providerData: userRecord.providerData.map(provider => ({
              providerId: provider.providerId,
              uid: provider.uid,
              displayName: provider.displayName || null,
              email: provider.email || null,
              phoneNumber: provider.phoneNumber || null,
              photoURL: provider.photoURL || null
            })),
            customClaims: userRecord.customClaims || null,
            metadata: {
              creationTime: userRecord.metadata.creationTime || null,
              lastSignInTime: userRecord.metadata.lastSignInTime || null,
              lastRefreshTime: userRecord.metadata.lastRefreshTime || null
            },
            tenantId: userRecord.tenantId || null,
            multiFactor: userRecord.multiFactor ? {
              enrolledFactors: userRecord.multiFactor.enrolledFactors.map(factor => ({
                uid: factor.uid,
                factorId: factor.factorId,
                displayName: factor.displayName || null,
                enrollmentTime: factor.enrollmentTime || null
              }))
            } : null,
            contacts: profileData?.contacts || {
              email: userRecord.email || null,
              phone: userRecord.phoneNumber || null,
              telegram: null,
              whatsapp: null,
              viber: null,
              discord: null,
              linkedin: null,
              github: null,
              website: null
            }
          } : {
            // Для других пользователей возвращаем только публичные данные
            id: userRecord.uid,
            email: null,
            avatar: profileData?.avatar || userRecord.photoURL || null,
            emailVerified: false,
            displayName: profileData?.displayName || userRecord.displayName || userRecord.email || null,
            position: profileData?.position || null,
            disabled: false,
            isAnonymous: false,
            providerData: [],
            customClaims: null,
            metadata: {
              creationTime: null,
              lastSignInTime: null,
              lastRefreshTime: null
            },
            tenantId: null,
            multiFactor: null,
            contacts: {
              email: null,
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

          return {
            userId,
            user,
            lastMessage: chatData.lastMessage
          }
        } catch (error) {
          console.error(`Error fetching user data for ${userId}:`, error)
          // В случае ошибки возвращаем минимальные данные
          return {
            userId,
            user: {
              id: userId,
              email: null,
              avatar: null,
              emailVerified: false,
              displayName: null,
              position: null,
              disabled: false,
              isAnonymous: false,
              providerData: [],
              customClaims: null,
              metadata: {
                creationTime: null,
                lastSignInTime: null,
                lastRefreshTime: null
              },
              tenantId: null,
              multiFactor: null,
              contacts: {
                email: null,
                phone: null,
                telegram: null,
                whatsapp: null,
                viber: null,
                discord: null,
                linkedin: null,
                github: null,
                website: null
              }
            },
            lastMessage: chatData.lastMessage
          }
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
          const nameA = a.user.displayName || a.user.email || ''
          const nameB = b.user.displayName || b.user.email || ''
          comparison = nameA.localeCompare(nameB)
          break
        case 'email':
          const emailA = a.user.email || ''
          const emailB = b.user.email || ''
          comparison = emailA.localeCompare(emailB)
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