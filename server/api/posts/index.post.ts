import { db, auth } from '~~/server/utils/firebase-admin'
import { defineEventHandler, createError, readBody } from 'h3'
import { checkAuth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // Проверяем авторизацию
    const authResult = await checkAuth(event)
    if (!authResult.isAuthenticated || !authResult.currentUserId) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }

    const body = await readBody(event)
    const { title, cover, annotation, keywords, domain, content, deadline } = body

    // Validate required fields
    if (!title || !annotation || !keywords || !domain || !content) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields'
      })
    }

    // Get user from Firebase Auth
    const userRecord = await auth.getUser(authResult.currentUserId)
    
    // Create post document
    const postRef = db.collection('posts').doc()
    const post = {
      id: postRef.id,
      title,
      cover: cover || null,
      annotation,
      keywords,
      domain,
      content,
      deadline: deadline || null,
      status: 'draft',
      ownerId: userRecord.uid,
      authorId: [userRecord.uid],
      views: 0,
      likes: 0,
      currentParticipants: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: {
        id: userRecord.uid,
        email: userRecord.email || null,
        avatar: userRecord.photoURL || null,
        displayName: userRecord.displayName || userRecord.email || null
      }
    }

    // Save post to Firestore
    await postRef.set(post)

    // Fetch author profiles
    const authorProfiles = await Promise.all(
      post.authorId.map(async (authorId) => {
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

    // Return post with author profiles
    return {
      ...post,
      author: authorProfiles.filter(Boolean)
    }
  } catch (error: any) {
    console.error('Error in /api/posts POST:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error'
    })
  }
})
