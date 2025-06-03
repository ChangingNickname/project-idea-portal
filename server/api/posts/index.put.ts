import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { defineEventHandler, createError, readBody } from 'h3'
import { checkAuth } from '~~/server/utils/auth'

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  })
}

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
    const { id, title, cover, annotation, keywords, domain, content, executionPolicy, maxParticipants, deadline, status } = body

    // Validate required fields
    if (!id || !title || !annotation || !keywords || !domain || !content || !executionPolicy) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields'
      })
    }

    // Initialize Firestore
    const db = getFirestore()
    
    // Check if post exists and user is owner
    const postRef = db.collection('posts').doc(id)
    const postDoc = await postRef.get()
    
    if (!postDoc.exists) {
      throw createError({
        statusCode: 404,
        message: 'Post not found'
      })
    }

    const postData = postDoc.data()
    if (postData?.ownerId !== authResult.currentUserId) {
      throw createError({
        statusCode: 403,
        message: 'Not authorized to update this post'
      })
    }

    // Update post
    const updatedPost = {
      ...postData,
      title,
      cover: cover || null,
      annotation,
      keywords,
      domain,
      content,
      executionPolicy,
      maxParticipants: maxParticipants || null,
      deadline: deadline || null,
      status: status || postData.status,
      updatedAt: new Date().toISOString()
    }

    await postRef.update(updatedPost)

    return updatedPost
  } catch (error: any) {
    console.error('Error in /api/posts PUT:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error'
    })
  }
})
