import { db } from '~~/server/utils/firebase-admin'
import { defineEventHandler, createError, readBody } from 'h3'
import { checkAuth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const authResult = await checkAuth(event)
    if (!authResult.isAuthenticated || !authResult.currentUserId) {
      throw createError({
        statusCode: 401,
        message: 'Authentication required'
      })
    }

    // Get post ID from route params
    const id = event.context.params?.id
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Post ID is required'
      })
    }

    // Get request body
    const body = await readBody(event)
    console.log('body', body)
    if (!body) {
      throw createError({
        statusCode: 400,
        message: 'Request body is required'
      })
    }

    // Get post document
    const postRef = db.collection('posts').doc(id)
    const postDoc = await postRef.get()
    
    if (!postDoc.exists) {
      throw createError({
        statusCode: 404,
        message: 'Post not found'
      })
    }

    // Check if user is the owner or author
    const postData = postDoc.data()
    if (!postData) {
      throw createError({
        statusCode: 404,
        message: 'Post not found'
      })
    }

    const isOwner = postData.ownerId === authResult.currentUserId
    const isAuthor = postData.authorId?.includes(authResult.currentUserId)
    
    // Ensure currentParticipants is an array
    const currentParticipants = Array.isArray(postData.currentParticipants) 
      ? postData.currentParticipants 
      : []
    const isParticipant = currentParticipants.includes(authResult.currentUserId)

    console.log('Auth check:', {
      currentUserId: authResult.currentUserId,
      ownerId: postData.ownerId,
      authorId: postData.authorId,
      isOwner,
      isAuthor,
      isParticipant,
      currentParticipants
    })

    // Если это запрос на выход из проекта
    if (body.action === 'leaveProject') {
      if (!isParticipant) {
        throw createError({
          statusCode: 403,
          message: 'You are not a participant in this project'
        })
      }

      // Удаляем пользователя из списка участников
      const updatedParticipants = currentParticipants.filter(
        (id: string) => id !== authResult.currentUserId
      )

      const updateData = {
        currentParticipants: updatedParticipants,
        updatedAt: new Date().toISOString()
      }
      await postRef.update(updateData)
    } else {
      // Обычное обновление поста (включая участников, если они переданы)
      console.log('Starting regular post update...')
      if (!isOwner && !isAuthor) {
        console.log('Permission denied: user is not owner or author')
        throw createError({
          statusCode: 403,
          message: 'Only the owner or author can edit the post'
        })
      }
      
      console.log('Permission granted, proceeding with update...')

      console.log('Updating post with data:', body)
      
      // Удаляем поля, которые не должны обновляться напрямую
      const { id, createdAt, ...updateFields } = body
      console.log('Fields after removing id and createdAt:', updateFields)
      
      // Проверяем и обрабатываем специальные поля
      const processedFields: any = {}
      
      // Обрабатываем каждое поле отдельно
      Object.entries(updateFields).forEach(([key, value]) => {
        console.log(`Processing field ${key}:`, value, 'type:', typeof value)
        if (value !== undefined && value !== null) {
          // Проверяем специальные типы данных
          if (Array.isArray(value)) {
            processedFields[key] = value
            console.log(`Added array field ${key}:`, value)
          } else if (typeof value === 'object') {
            processedFields[key] = value
            console.log(`Added object field ${key}:`, value)
          } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            processedFields[key] = value
            console.log(`Added primitive field ${key}:`, value)
          } else {
            console.log(`Skipping field ${key} with unsupported type:`, typeof value, value)
          }
        } else {
          console.log(`Skipping field ${key} because it's null or undefined`)
        }
      })
      
      console.log('Processed fields:', processedFields)
      
      const updateData = {
        ...processedFields,
        updatedAt: new Date().toISOString()
      }
      
      console.log('Final update data:', updateData)
      
      // Выполняем обновление
      try {
        await postRef.update(updateData)
        console.log('Update completed successfully')
      } catch (updateError: any) {
        console.error('Firebase update error:', updateError)
        throw createError({
          statusCode: 500,
          message: `Failed to update post: ${updateError.message}`
        })
      }
      
      // Проверяем, что обновление действительно произошло
      const checkUpdate = await postRef.get()
      const updatedData = checkUpdate.data()
      console.log('Verification - updated data:', updatedData)
      
      // Проверяем ключевые поля
      const fieldsToCheck = ['title', 'annotation', 'content', 'status']
      fieldsToCheck.forEach(field => {
        if (updateData[field] !== undefined) {
          console.log(`Field ${field}: expected=${updateData[field]}, actual=${updatedData?.[field]}`)
        }
      })
    }

    // Get updated post
    const updatedPost = await postRef.get()
    const post = {
      id: updatedPost.id,
      ...updatedPost.data()
    } as Post

    console.log('Updated post data:', post)

    // Fetch author profiles
    const authorProfiles = await Promise.all(
      (post.authorId || []).map(async (authorId: string) => {
        try {
          const profileDoc = await db.collection('profiles').doc(authorId).get()
          if (profileDoc.exists) {
            return {
              id: profileDoc.id,
              ...profileDoc.data()
            }
          }
          return null
        } catch (error) {
          console.error(`Error fetching profile for ${authorId}:`, error)
          return null
        }
      })
    )

    const result = {
      ...post,
      author: authorProfiles.filter(Boolean)
    }
    
    console.log('Final response:', result)
    
    return result
  } catch (error: any) {
    console.error('Error updating post:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal server error'
    })
  }
}) 