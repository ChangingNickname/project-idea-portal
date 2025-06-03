import { db } from '~~/server/utils/firebase-admin'
import { defineEventHandler, createError } from 'h3'
import { checkAuth } from '~~/server/utils/auth'

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
      authorIds,
      ownerId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      executionPolicy,
      keywords
    } = query

    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    // Build query
    let postsQuery = db.collection('posts')
    
    // Apply filters
    if (domain) {
      postsQuery = postsQuery.where('domain', '==', domain as string)
    }
    if (status) {
      postsQuery = postsQuery.where('status', '==', status as string)
    }
    if (authorId) {
      console.log('Searching for posts with authorId:', authorId)
      postsQuery = postsQuery.where('authorId', 'array-contains', authorId as string)
    }
    if (authorIds) {
      const authorIdsArray = Array.isArray(authorIds) ? authorIds : [authorIds]
      console.log('Searching for posts with authorIds:', authorIdsArray)
      postsQuery = postsQuery.where('authorId', 'array-contains-any', authorIdsArray)
    }
    if (ownerId) {
      console.log('Searching for posts with ownerId:', ownerId)
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

    // Fetch author profiles for all posts
    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
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

        return {
          ...post,
          author: authorProfiles.filter(Boolean)
        }
      })
    )

    return {
      posts: postsWithAuthors,
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
