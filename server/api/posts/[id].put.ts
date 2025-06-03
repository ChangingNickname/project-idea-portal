import { db } from '~~/server/utils/firebase-admin'
import { defineEventHandler, createError, readBody } from 'h3'

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

    // Update post
    const updateData = {
      ...body,
      updatedAt: new Date().toISOString()
    }
    await postRef.update(updateData)

    // Get updated post
    const updatedPost = await postRef.get()
    const post = {
      id: updatedPost.id,
      ...updatedPost.data()
    } as Post

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
    console.error('Error updating post:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error'
    })
  }
}) 