import { db } from '~~/server/utils/firebase-admin'
import { defineEventHandler, createError } from 'h3'
import { Query } from 'firebase-admin/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import { checkAuth } from '~~/server/utils/auth'

interface Post {
  id: string
  title: string
  ownerId: string
  authorId: string[]
  subjectAreas?: Array<{
    key: string
    i18nKey: string
  }>
  status: 'draft' | 'published' | 'archived'
  [key: string]: any
}

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
    const domain = (query.domain as string) || ''
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
    if (!isOwnerOrAuthor) {
      // Если пользователь не владелец и не автор, показываем только опубликованные
      postsQuery = postsQuery.where('status', '==', 'published')
    } else {
      // Если пользователь владелец или автор, показываем все его посты
      if (ownerId) {
        postsQuery = postsQuery.where('ownerId', '==', ownerId)
      }
      if (authorId) {
        postsQuery = postsQuery.where('authorId', 'array-contains', authorId)
      }
    }

    // Получаем все посты
    const postsSnapshot = await postsQuery.get()
    let posts = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Post[]

    // Фильтруем по subjectAreas если указан domain
    if (domain) {
      posts = posts.filter(post => {
        const subjectAreas = post.subjectAreas || []
        return subjectAreas.some(area => 
          area.i18nKey === `subjectAreas.${domain}` || 
          area.key === domain.split('.').pop()
        )
      })
    }

    // Получаем общее количество после фильтрации
    const total = posts.length

    // Применяем сортировку
    posts.sort((a, b) => {
      const aValue = a[sortBy] || 0
      const bValue = b[sortBy] || 0
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