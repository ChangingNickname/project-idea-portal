import { db } from '~~/server/utils/firebase-admin'
import { defineEventHandler, createError, readBody } from 'h3'
import { checkAuth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const authResult = await checkAuth(event)
    if (!authResult.isAuthenticated || !authResult.currentUserId) {
      throw createError({
        statusCode: 401,
        message: 'Требуется авторизация'
      })
    }

    // Get post ID from route params
    const id = event.context.params?.id
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Post ID is required'
      })
    }

    // Get request body
    const body = await readBody(event)
    if (!body) {
      throw createError({
        statusCode: 400,
        message: 'Request body is required'
      })
    }

    // Get post document
    const postRef = db.collection('posts').doc(id)
    const postDoc = await postRef.get()
    
    if (!postDoc.exists) {
      throw createError({
        statusCode: 404,
        message: 'Post not found'
      })
    }

    // Check if user is the owner or author
    const postData = postDoc.data()
    if (!postData) {
      throw createError({
        statusCode: 404,
        message: 'Пост не найден'
      })
    }

    const isParticipant = postData.currentParticipants?.includes(authResult.currentUserId)

    // Если это запрос на выход из проекта
    if (body.action === 'leaveProject') {
      if (!isParticipant) {
        throw createError({
          statusCode: 403,
          message: 'Вы не являетесь участником этого проекта'
        })
      }

      // Удаляем пользователя из списка участников
      const updatedParticipants = postData.currentParticipants.filter(
        (id: string) => id !== authResult.currentUserId
      )

      const updateData = {
        currentParticipants: updatedParticipants,
        updatedAt: new Date().toISOString()
      }
      await postRef.update(updateData)

      return {
        success: true,
        message: 'Вы успешно вышли из проекта'
      }
    }

    throw createError({
      statusCode: 400,
      message: 'Неизвестное действие'
    })
  } catch (error: any) {
    console.error('Error processing post action:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error'
    })
  }
}) 