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

    // Проверяем, является ли пользователь владельцем или автором
    const isOwner = post.ownerId === authResult.currentUserId
    const isAuthor = post.authorId?.includes(authResult.currentUserId)

    if (!isOwner && !isAuthor) {
      throw createError({
        statusCode: 403,
        message: 'Только владелец или автор может изменять метаданные поста'
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
    const updateData = {
      views: body.views || post.views || 0,
      likes: body.likes || post.likes || 0,
      viewedBy: body.viewedBy || post.viewedBy || [],
      updatedAt: new Date().toISOString()
    }

    await postDoc.ref.update(updateData)

    return {
      ...post,
      ...updateData
    }
  } catch (error: any) {
    console.error('Error updating post meta:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error'
    })
  }
})
