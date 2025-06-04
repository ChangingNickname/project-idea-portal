import { db } from '~~/server/utils/firebase-admin'
import { defineEventHandler, readBody, createError } from 'h3'
import { checkAuth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const params = event.context.params
    if (!params || !params.id) {
      throw createError({ statusCode: 400, message: 'Missing post id' })
    }
    const id = params.id

    // Get post document first
    const postRef = db.collection('posts').doc(id)
    const postDoc = await postRef.get()
    if (!postDoc.exists) {
      throw createError({ statusCode: 404, message: 'Post not found' })
    }

    const postData = postDoc.data()
    if (!postData) {
      throw createError({ statusCode: 500, message: 'Post data is undefined' })
    }

    // Try to get user ID from body, but don't require it
    const body = await readBody(event)
    const userId = body?.userId

    // If we have a userId, check if the user has already viewed the post
    if (userId) {
      const viewedBy = Array.isArray(postData.viewedBy) ? postData.viewedBy : []
      
      if (!viewedBy.includes(userId)) {
        await postRef.update({
          views: (postData.views || 0) + 1,
          viewedBy: [...viewedBy, userId]
        })
      }
    } else {
      // If no userId, just increment the view count
      await postRef.update({
        views: (postData.views || 0) + 1
      })
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error updating views:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error'
    })
  }
}) 