import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { defineEventHandler, readBody, createError } from 'h3'

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n')
    })
  })
}

const db = getFirestore()

export default defineEventHandler(async (event) => {
  try {
    const params = event.context.params
    if (!params || !params.id) {
      throw createError({ statusCode: 400, message: 'Missing post id' })
    }
    const id = params.id
    const { userId } = await readBody(event)
    if (!userId) {
      throw createError({ statusCode: 400, message: 'Missing userId' })
    }

    const postRef = db.collection('posts').doc(id)
    const postDoc = await postRef.get()
    if (!postDoc.exists) {
      throw createError({ statusCode: 404, message: 'Post not found' })
    }

    const postData = postDoc.data()
    if (!postData) {
      throw createError({ statusCode: 500, message: 'Post data is undefined' })
    }
    const viewedBy = Array.isArray(postData.viewedBy) ? postData.viewedBy : []

    if (!viewedBy.includes(userId)) {
      await postRef.update({
        views: (postData.views || 0) + 1,
        viewedBy: [...viewedBy, userId]
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