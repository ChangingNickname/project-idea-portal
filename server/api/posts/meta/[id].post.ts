import { db } from '~~/server/utils/firebase-admin'
import { defineEventHandler, createError, readBody } from 'h3'
import { checkAuth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // Get post ID from route params
    const id = event.context.params?.id
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Post ID is required'
      })
    }

    // Get post document
    const postDoc = await db.collection('posts').doc(id).get()

    if (!postDoc.exists) {
      throw createError({
        statusCode: 404,
        message: 'Post not found'
      })
    }

    // Get post data
    const post = {
      id: postDoc.id,
      ...postDoc.data()
    } as Post

    // Проверяем авторизацию
    const authResult = await checkAuth(event)
    if (!authResult.isAuthenticated || !authResult.currentUserId) {
      throw createError({
        statusCode: 401,
        message: 'Требуется авторизация'
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

    // Обновляем только метаданные
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    // Обновляем лайки и просмотры
    if (typeof body.likes === 'number') {
      updateData.likes = body.likes
    }
    if (Array.isArray(body.viewedBy)) {
      updateData.viewedBy = body.viewedBy
    }

    // Обновляем документ
    await postDoc.ref.update(updateData)

    // Получаем обновленные данные
    const updatedDoc = await postDoc.ref.get()
    const updatedPost = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Post

    return updatedPost
  } catch (error: any) {
    console.error('Error updating post meta:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error'
    })
  }
})
