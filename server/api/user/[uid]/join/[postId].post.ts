import { getFirestore } from 'firebase-admin/firestore'
import { defineEventHandler, createError, getQuery } from 'h3'
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
    // Получаем параметры из URL
    const uid = event.context.params?.uid
    const postId = event.context.params?.postId
    const query = getQuery(event)
    const accept = query.accept === 'true'

    if (!uid || !postId) {
      throw createError({
        statusCode: 400,
        message: 'Необходимо указать ID пользователя и поста'
      })
    }

    // Проверяем, что текущий пользователь является владельцем поста
    const postRef = db.collection('posts').doc(postId)
    const postDoc = await postRef.get()
    
    if (!postDoc.exists) {
      throw createError({
        statusCode: 404,
        message: 'Пост не найден'
      })
    }

    const postData = postDoc.data()
    if (!postData) {
      throw createError({
        statusCode: 404,
        message: 'Пост не найден'
      })
    }

    // Проверяем, что текущий пользователь является владельцем или автором
    const isOwner = postData.ownerId === authResult.currentUserId
    const isAuthor = postData.authorId?.includes(authResult.currentUserId)

    if (!isOwner && !isAuthor) {
      throw createError({
        statusCode: 403,
        message: 'Только владелец или автор может принимать запросы на присоединение'
      })
    }

    if (accept) {
      // Добавляем пользователя в список участников
      const currentParticipants = postData.currentParticipants || []
      if (!currentParticipants.includes(uid)) {
        await postRef.update({
          currentParticipants: [...currentParticipants, uid],
          updatedAt: new Date().toISOString()
        })
      }
    }

    return {
      success: true,
      message: accept ? 'Пользователь добавлен в участники' : 'Запрос отклонен'
    }
  } catch (error: any) {
    console.error('Ошибка обработки запроса на присоединение:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Внутренняя ошибка сервера'
    })
  }
}) 