import { db } from '~~/server/utils/firebase-admin'
import { defineEventHandler, createError } from 'h3'
import { Query } from 'firebase-admin/firestore'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      title = '',
      domain = '',
      keywords = '',
      authors = '',
      status = 'published',
      dateFrom = '',
      dateTo = '',
      viewsFrom = '',
      viewsTo = '',
      likesFrom = '',
      likesTo = '',
      ownerId = '',
      sortBy = 'createdAt',
      sortDirection = 'desc'
    } = query

    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    // Build query
    let postsQuery: Query = db.collection('posts')
    
    // Apply filters
    if (status && typeof status === 'string') {
      postsQuery = postsQuery.where('status', '==', status)
    }

    if (ownerId && typeof ownerId === 'string') {
      postsQuery = postsQuery.where('ownerId', '==', ownerId)
    }

    if (domain && typeof domain === 'string') {
      postsQuery = postsQuery.where('domain', '==', domain)
    }

    // Get total count before pagination
    const totalSnapshot = await postsQuery.count().get()
    const total = totalSnapshot.data().count

    // Apply sorting and pagination
    const postsSnapshot = await postsQuery
      .orderBy(sortBy as string, sortDirection as 'asc' | 'desc')
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

    // Apply additional filters
    if (title && typeof title === 'string') {
      const titleLower = title.toLowerCase()
      posts = posts.filter(post => post.title.toLowerCase().includes(titleLower))
    }

    if (keywords && typeof keywords === 'string') {
      const keywordsArray = keywords.toLowerCase().split(',').map(k => k.trim())
      posts = posts.filter(post => 
        keywordsArray.some(keyword => 
          post.keywords.some(k => k.toLowerCase().includes(keyword))
        )
      )
    }

    // Фильтрация по авторам
    if (authors && typeof authors === 'string') {
      const authorIds = authors.split(',').map(id => id.trim())
      posts = posts.filter(post => {
        // Проверяем, содержит ли пост хотя бы одного из выбранных авторов
        return authorIds.some(authorId => 
          post.ownerId === authorId || 
          (post.authorId && post.authorId.includes(authorId))
        )
      })
    }

    if (dateFrom && typeof dateFrom === 'string') {
      const fromDate = new Date(dateFrom)
      posts = posts.filter(post => new Date(post.createdAt) >= fromDate)
    }

    if (dateTo && typeof dateTo === 'string') {
      const toDate = new Date(dateTo)
      posts = posts.filter(post => new Date(post.createdAt) <= toDate)
    }

    if (viewsFrom && typeof viewsFrom === 'string') {
      const viewsFromNum = Number(viewsFrom)
      posts = posts.filter(post => post.views >= viewsFromNum)
    }

    if (viewsTo && typeof viewsTo === 'string') {
      const viewsToNum = Number(viewsTo)
      posts = posts.filter(post => post.views <= viewsToNum)
    }

    if (likesFrom && typeof likesFrom === 'string') {
      const likesFromNum = Number(likesFrom)
      posts = posts.filter(post => post.likes >= likesFromNum)
    }

    if (likesTo && typeof likesTo === 'string') {
      const likesToNum = Number(likesTo)
      posts = posts.filter(post => post.likes <= likesToNum)
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
          (post.authorId || []).map(async (authorId) => {
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
          author: [owner, ...authorProfiles.filter(Boolean)]
        }
      })
    )

    return {
      posts: postsWithProfiles,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
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