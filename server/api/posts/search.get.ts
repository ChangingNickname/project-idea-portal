import { db } from '~~/server/utils/firebase-admin'
import { defineEventHandler, createError } from 'h3'
import { Query } from 'firebase-admin/firestore'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    console.log('Search query parameters:', query)
    
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

    console.log('Pagination:', { skip, take, page, limit })

    // Build query
    let postsQuery: Query = db.collection('posts')
    console.log('Initial query:', postsQuery)
    
    // Apply filters
    if (status && typeof status === 'string') {
      postsQuery = postsQuery.where('status', '==', status)
      console.log('After status filter:', status)
    }

    if (ownerId && typeof ownerId === 'string') {
      postsQuery = postsQuery.where('ownerId', '==', ownerId)
      console.log('After ownerId filter:', ownerId)
    }

    if (domain && typeof domain === 'string') {
      postsQuery = postsQuery.where('domain', '==', domain)
      console.log('After domain filter:', domain)
    }

    // Apply date filters
    if (dateFrom && typeof dateFrom === 'string') {
      const fromDate = new Date(dateFrom)
      postsQuery = postsQuery.where('createdAt', '>=', fromDate.toISOString())
      console.log('After dateFrom filter:', fromDate.toISOString())
    }

    if (dateTo && typeof dateTo === 'string') {
      const toDate = new Date(dateTo)
      postsQuery = postsQuery.where('createdAt', '<=', toDate.toISOString())
      console.log('After dateTo filter:', toDate.toISOString())
    }

    // Apply views filters
    if (viewsFrom && typeof viewsFrom === 'string') {
      const viewsFromNum = Number(viewsFrom)
      postsQuery = postsQuery.where('views', '>=', viewsFromNum)
      console.log('After viewsFrom filter:', viewsFromNum)
    }

    if (viewsTo && typeof viewsTo === 'string') {
      const viewsToNum = Number(viewsTo)
      postsQuery = postsQuery.where('views', '<=', viewsToNum)
      console.log('After viewsTo filter:', viewsToNum)
    }

    // Apply likes filters
    if (likesFrom && typeof likesFrom === 'string') {
      const likesFromNum = Number(likesFrom)
      postsQuery = postsQuery.where('likes', '>=', likesFromNum)
      console.log('After likesFrom filter:', likesFromNum)
    }

    if (likesTo && typeof likesTo === 'string') {
      const likesToNum = Number(likesTo)
      postsQuery = postsQuery.where('likes', '<=', likesToNum)
      console.log('After likesTo filter:', likesToNum)
    }

    // Apply sorting
    postsQuery = postsQuery.orderBy(sortBy as string, sortDirection as 'asc' | 'desc')
    console.log('After sorting:', { sortBy, sortDirection })

    // Get total count before pagination
    const totalSnapshot = await postsQuery.count().get()
    const total = totalSnapshot.data().count
    console.log('Total count:', total)

    // Apply pagination
    postsQuery = postsQuery.limit(take).offset(skip)
    console.log('After pagination:', { skip, take })

    // Get posts
    const postsSnapshot = await postsQuery.get()
    let posts = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[]
    console.log('Raw posts from Firestore:', posts)

    // Apply text search if provided
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase()
      posts = posts.filter(post => 
        post.title?.toLowerCase().includes(searchLower) ||
        post.annotation?.toLowerCase().includes(searchLower) ||
        post.content?.toLowerCase().includes(searchLower) ||
        post.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
      )
      console.log('After text search:', posts)
    }

    // Apply title filter
    if (title && typeof title === 'string') {
      const titleLower = title.toLowerCase()
      posts = posts.filter(post => post.title?.toLowerCase().includes(titleLower))
      console.log('After title filter:', posts)
    }

    // Apply keywords filter
    if (keywords && typeof keywords === 'string') {
      const keywordsArray = keywords.toLowerCase().split(',').map(k => k.trim())
      posts = posts.filter(post => 
        post.keywords?.some(k => keywordsArray.some(keyword => k.toLowerCase().includes(keyword)))
      )
      console.log('After keywords filter:', posts)
    }

    // Filter by authors
    if (authors && typeof authors === 'string') {
      const authorIds = authors.split(',').map(id => id.trim())
      posts = posts.filter(post => {
        return authorIds.some(authorId => 
          post.ownerId === authorId || 
          (post.authorId && post.authorId.includes(authorId))
        )
      })
      console.log('After authors filter:', posts)
    }

    // Fetch owner and author profiles for all posts
    const postsWithProfiles = await Promise.all(
      posts.map(async (post) => {
        try {
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
        } catch (error) {
          console.error(`Error fetching profiles for post ${post.id}:`, error)
          return post
        }
      })
    )
    console.log('Final posts with profiles:', postsWithProfiles)

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