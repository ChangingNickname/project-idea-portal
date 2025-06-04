import { db } from '~~/server/utils/firebase-admin'
import { defineEventHandler, createError } from 'h3'
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

    // Если пост опубликован, возвращаем его без проверки авторизации
    if (post.status === 'published') {
      // Fetch author profiles
      const authorProfiles = await Promise.all(
        (post.authorId || []).map(async (authorId: string) => {
          const profileDoc = await db.collection('profiles').doc(authorId).get()
          if (profileDoc.exists) {
            return {
              id: profileDoc.id,
              ...profileDoc.data()
            }
          }
          return null
        })
      )

      return {
        ...post,
        author: authorProfiles.filter(Boolean)
      }
    }

    // Для неопубликованных постов проверяем авторизацию
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
        message: 'Only the post owner or author can access unpublished posts'
      })
    }

    // Fetch author profiles
    const authorProfiles = await Promise.all(
      (post.authorId || []).map(async (authorId: string) => {
        const profileDoc = await db.collection('profiles').doc(authorId).get()
        if (profileDoc.exists) {
          return {
            id: profileDoc.id,
            ...profileDoc.data()
          }
        }
        return null
      })
    )

    return {
      ...post,
      author: authorProfiles.filter(Boolean)
    }
  } catch (error: any) {
    console.error('Error fetching post:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error'
    })
  }
}) 