import { db } from '~~/server/utils/firebase-admin'
import { defineEventHandler, createError } from 'h3'
import { Query } from 'firebase-admin/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import { checkAuth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const db = getFirestore()

  // Проверяем авторизацию
  const authResult = await checkAuth(event)
  if (!authResult.isAuthenticated || !authResult.currentUserId) {
    throw createError({
      statusCode: 401,
      message: 'Требуется авторизация'
    })
  }

  try {
    const query = getQuery(event)
    const searchQuery = (query.q as string) || ''
    
    // Accept both 'domain' and 'subjectAreas' for backward compatibility
    const subjectAreas = query.subjectAreas || query.domain
    const subjectAreasArray = Array.isArray(subjectAreas) 
      ? subjectAreas 
      : typeof subjectAreas === 'string' 
        ? subjectAreas.split(',') 
        : []
    
    console.log('Search params:', {
      subjectAreas,
      subjectAreasArray,
      query,
      ownerId: query.ownerId,
      authorId: query.authorId,
      isOwnerOrAuthor: !!query.ownerId || !!query.authorId
    })

    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 9
    const sortBy = (query.sortBy as string) || 'createdAt'
    const sortDirection = (query.sortDirection as 'asc' | 'desc') || 'desc'
    const ownerId = query.ownerId as string
    const authorId = query.authorId as string

    // Базовый запрос
    let postsQuery: Query = db.collection('posts')

    // Применяем фильтры
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      postsQuery = postsQuery.where('title', '>=', searchLower)
        .where('title', '<=', searchLower + '\uf8ff')
    }

    // Фильтр по статусу
    const isOwnerOrAuthor = !!ownerId || !!authorId
    console.log('Status filter check:', {
      isOwnerOrAuthor,
      ownerId,
      authorId,
      willShowOnlyPublished: !isOwnerOrAuthor
    })
    
    if (!isOwnerOrAuthor) {
      // Если пользователь не владелец и не автор, показываем только опубликованные
      postsQuery = postsQuery.where('status', '==', 'published')
      console.log('Applied published-only filter')
    } else {
      // Если пользователь владелец или автор, показываем все его посты
      if (ownerId) {
        postsQuery = postsQuery.where('ownerId', '==', ownerId)
        console.log('Applied owner filter for:', ownerId)
      }
      if (authorId) {
        postsQuery = postsQuery.where('authorId', 'array-contains', authorId)
        console.log('Applied author filter for:', authorId)
      }
    }

    // Получаем все посты
    const postsSnapshot = await postsQuery.get()
    let posts = postsSnapshot.docs.map(doc => {
      const data = doc.data()
      // Remove cover field from logging to avoid large base64 data
      const { cover, ...dataWithoutCover } = data
      console.log(`Post ${doc.id} raw data:`, dataWithoutCover)
      return {
        id: doc.id,
        ...data
      }
    }) as Post[]

    console.log('Before any filters:', {
      totalPosts: posts.length,
      posts: posts.map(p => ({ id: p.id, status: p.status, subjectAreas: p.subjectAreas?.length || 0 }))
    })

    console.log('Before subjectAreas filter:', {
      totalPosts: posts.length,
      firstPostSubjectAreas: posts[0]?.subjectAreas,
      firstPostKeys: posts[0] ? Object.keys(posts[0]) : [],
      firstPostFull: posts[0] ? (() => { const { cover, ...rest } = posts[0]; return rest; })() : null
    })

    // Фильтруем по subjectAreas если указан subjectAreas
    if (subjectAreasArray.length > 0) {
      posts = posts.filter(post => {
        const postSubjectAreas = post.subjectAreas || []
        const hasMatchingSubjectAreas = postSubjectAreas.some(area => 
          subjectAreasArray.includes(area.key)
        )
        console.log('Post filter:', {
          postId: post.id,
          postSubjectAreas,
          searchSubjectAreas: subjectAreasArray,
          hasMatchingSubjectAreas
        })
        return hasMatchingSubjectAreas
      })
    }

    console.log('After subjectAreas filter:', {
      totalPosts: posts.length,
      subjectAreas: subjectAreasArray,
      remainingPosts: posts.map(p => ({ id: p.id, status: p.status }))
    })

    // Получаем общее количество после фильтрации
    const total = posts.length

    // Применяем сортировку
    posts.sort((a, b) => {
      const aValue = a[sortBy as keyof Post] || 0
      const bValue = b[sortBy as keyof Post] || 0
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      }
      return aValue < bValue ? 1 : -1
    })

    // Применяем пагинацию
    const start = (page - 1) * limit
    const end = start + limit
    posts = posts.slice(start, end)

    // Получаем информацию о владельцах и авторах
    const postsWithProfiles = await Promise.all(
      posts.map(async (post) => {
        try {
          // Получаем информацию о владельце
          const ownerDoc = await db.collection('profiles').doc(post.ownerId).get()
          const ownerData = ownerDoc.exists ? ownerDoc.data() : null
          
          // Получаем информацию об авторах
          const authorPromises = (post.authorId || [])
            .filter(id => id !== post.ownerId) // Исключаем владельца из списка авторов
            .map(async (authorId: string) => {
              const authorDoc = await db.collection('profiles').doc(authorId).get()
              return authorDoc.exists ? authorDoc.data() : null
            })
          
          const authors = (await Promise.all(authorPromises)).filter(Boolean)

          return {
            ...post,
            owner: ownerData,
            author: [ownerData, ...authors].filter(Boolean)
          }
        } catch (error) {
          console.error(`Error fetching profiles for post ${post.id}:`, error)
          return post
        }
      })
    )

    return {
      posts: postsWithProfiles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    console.error('Ошибка поиска постов:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Внутренняя ошибка сервера'
    })
  }
}) 