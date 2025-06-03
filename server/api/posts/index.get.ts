import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Query, CollectionReference } from 'firebase-admin/firestore'
import { defineEventHandler, createError } from 'h3'
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
    const query = getQuery(event)
    const { 
      page = 1, 
      limit = 10, 
      domain, 
      status,
      search,
      authorId,
      ownerId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      executionPolicy,
      keywords
    } = query

    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    // Initialize Firestore
    const db = getFirestore()
    
    // Build query
    let postsQuery: Query = db.collection('posts')
    
    // Apply filters
    if (domain) {
      postsQuery = postsQuery.where('domain', '==', domain as string)
    }
    if (status) {
      postsQuery = postsQuery.where('status', '==', status as string)
    }
    if (authorId) {
      postsQuery = postsQuery.where('authorId', 'array-contains', authorId as string)
    }
    if (ownerId) {
      postsQuery = postsQuery.where('ownerId', '==', ownerId as string)
    }
    if (executionPolicy) {
      postsQuery = postsQuery.where('executionPolicy', '==', executionPolicy as string)
    }
    if (keywords) {
      const keywordsArray = (keywords as string).split(',')
      postsQuery = postsQuery.where('keywords', 'array-contains-any', keywordsArray)
    }

    // Get total count before pagination
    const totalSnapshot = await postsQuery.count().get()
    const total = totalSnapshot.data().count

    // Apply sorting and pagination
    const postsSnapshot = await postsQuery
      .orderBy(sortBy as string, sortOrder as 'asc' | 'desc')
      .limit(take)
      .offset(skip)
      .get()

    let posts = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[]

    // Apply text search if provided
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase()
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.annotation.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
      )
    }

    return {
      posts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    }
  } catch (error: any) {
    console.error('Error in /api/posts GET:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error'
    })
  }
})
