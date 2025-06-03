import { db } from '~~/server/utils/firebase-admin'
import { defineEventHandler, createError } from 'h3'
import { Query } from 'firebase-admin/firestore'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { 
      page = 1, 
      limit = 10, 
      search = ''
    } = query

    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    // Build query
    let postsQuery: Query = db.collection('posts')
    
    // Only show published posts
    postsQuery = postsQuery.where('status', '==', 'published')

    // Get total count before pagination
    const totalSnapshot = await postsQuery.count().get()
    const total = totalSnapshot.data().count

    // Apply sorting and pagination
    const postsSnapshot = await postsQuery
      .orderBy('createdAt', 'desc')
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

    // Fetch owner and author profiles for all posts
    const postsWithProfiles = await Promise.all(
      posts.map(async (post) => {
        // Fetch owner profile
        const ownerDoc = await db.collection('profiles').doc(post.ownerId).get()
        const owner = ownerDoc.exists ? {
          id: ownerDoc.id,
          ...ownerDoc.data()
        } : null

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

        return {
          ...post,
          owner,
          author: authorProfiles.filter(Boolean)
        }
      })
    )

    return {
      posts: postsWithProfiles,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  } catch (error: any) {
    console.error('Error in /api/posts/search GET:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error'
    })
  }
}) 