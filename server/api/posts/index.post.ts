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
    const { title, cover, annotation, keywords, domain, content, executionPolicy, maxParticipants, deadline } = body

    // Validate required fields
    if (!title || !annotation || !keywords || !domain || !content || !executionPolicy) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields'
      })
    }

    // Get user from Firebase Auth
    const userRecord = await getAuth().getUser(authResult.currentUserId)
    
    // Initialize Firestore
    const db = getFirestore()
    
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
      executionPolicy,
      maxParticipants: maxParticipants || null,
      deadline: deadline || null,
      status: 'draft',
      ownerId: userRecord.uid,
      authorId: [userRecord.uid],
      views: 0,
      likes: 0,
      comments: 0,
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
