import { defineStore } from 'pinia'
import { useArticleBuilderStore } from '~/stores/articleBuilder'
import { useUserStore } from '~/stores/user'

interface AiAgentState {
  sessionToken: string | null
  isProcessing: boolean
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    user?: {
      id: string
      email: string
      avatar: string
      displayName: string
    }
    images?: Array<{
      id: string
      data: string
    }>
  }>
}

const STORAGE_KEY = 'ai_agent_session'
const TOKEN_KEY = 'ai_agent_token'

// Функция для загрузки состояния из sessionStorage
const loadState = (): Partial<AiAgentState> => {
  if (process.server) return {}
  
  try {
    const storedState = sessionStorage.getItem(STORAGE_KEY)
    const storedToken = sessionStorage.getItem(TOKEN_KEY)
    return {
      messages: storedState ? JSON.parse(storedState) : [],
      sessionToken: storedToken
    }
  } catch (error) {
    console.error('Failed to load AI agent state from sessionStorage:', error)
    return {
      messages: [],
      sessionToken: null
    }
  }
}

// Функция для сохранения состояния в sessionStorage
const saveState = (state: Partial<AiAgentState>) => {
  if (process.server) return

  try {
    if (state.messages) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.messages))
    }
    if (state.sessionToken) {
      sessionStorage.setItem(TOKEN_KEY, state.sessionToken)
    }
  } catch (error) {
    console.error('Failed to save AI agent state to sessionStorage:', error)
  }
}

export const useAiAgentStore = defineStore('aiagent', {
  state: (): AiAgentState => ({
    sessionToken: null,
    isProcessing: false,
    messages: [],
    ...loadState()
  }),

  actions: {
    setWelcomeMessage(welcomeMessage: any) {
      this.messages = [welcomeMessage]
      saveState({ messages: this.messages })
    },

    async generateToken() {
      try {
        console.log('[AiAgent] Generating new token...')
        const response = await $fetch<{ token: string }>('/api/aiagent/token.generate')
        this.sessionToken = response.token
        saveState({ sessionToken: response.token })
        console.log('[AiAgent] Token generated successfully')
        return response.token
      } catch (error) {
        console.error('[AiAgent] Failed to generate AI agent token:', error)
        // Очищаем токен при ошибке
        this.sessionToken = null
        saveState({ sessionToken: null })
        throw error
      }
    },

    async sendMessage(message: string): Promise<string> {
      console.log('[AiAgent] sendMessage called with:', message)
      
      if (!message) {
        console.log('[AiAgent] Empty message, skipping')
        return ''
      }

      const articleBuilderStore = useArticleBuilderStore()
      const userStore = useUserStore()

      // Check if post is published and user is not the owner
      if (articleBuilderStore.draft.status === 'published' && 
          articleBuilderStore.draft.ownerId !== userStore.user?.id) {
        console.log('[AiAgent] Cannot interact with published post')
        throw new Error('Cannot interact with published post')
      }

      // Проверяем, не отправляется ли уже сообщение
      if (this.isProcessing) {
        console.log('[AiAgent] Message is already being processed in store')
        return ''
      }

      try {
        this.isProcessing = true
        console.log('[AiAgent] Store processing message:', message)

        // Проверяем, не было ли уже отправлено такое сообщение
        const lastMessage = this.messages[this.messages.length - 1]
        if (lastMessage?.role === 'user' && lastMessage.content === message) {
          console.log('[AiAgent] Duplicate message detected in store, skipping')
          return ''
        }

        // Генерируем токен если его нет
        if (!this.sessionToken) {
          console.log('[AiAgent] No session token, generating new one')
          await this.generateToken()
        }

        // Извлекаем изображения из сообщения и articleDraft
        const images: Array<{ id: string; data: string }> = []
        
        // Функция для обработки base64 в объекте
        const processBase64InObject = (obj: any): any => {
          if (!obj) return obj
          
          if (typeof obj === 'string' && obj.startsWith('data:image/')) {
            const id = `img_${Date.now()}_${images.length}`
            images.push({ id, data: obj })
            return `[image:${id}]`
          }
          
          if (Array.isArray(obj)) {
            return obj.map(item => processBase64InObject(item))
          }
          
          if (typeof obj === 'object') {
            const result: any = {}
            for (const [key, value] of Object.entries(obj)) {
              result[key] = processBase64InObject(value)
            }
            return result
          }
          
          return obj
        }

        // Обрабатываем сообщение и articleDraft
        const processedMessage = processBase64InObject(message)
        const processedDraft = processBase64InObject(articleBuilderStore.draft)

        // Добавляем сообщение пользователя
        const userMessage = {
          role: 'user' as const,
          content: processedMessage,
          timestamp: new Date().toISOString(),
          images,
          user: {
            id: userStore.user?.id || 'anonymous',
            email: userStore.user?.email || '',
            avatar: userStore.user?.avatar || '',
            displayName: userStore.user?.displayName || userStore.user?.email || 'Anonymous User'
          }
        }

        console.log('[AiAgent] Adding user message to store:', userMessage)
        this.messages = [...this.messages, userMessage]
        saveState({ messages: this.messages })

        console.log('[AiAgent] Sending to API:', {
          message: processedMessage,
          sessionToken: this.sessionToken,
          imagesCount: images.length
        })

        // Функция для отправки запроса с автоматическим восстановлением
        const sendRequestWithAutoRecovery = async (retryCount = 0): Promise<any> => {
          try {
            return await $fetch<{ answer: string; schema: any; error?: any }>('/api/aiagent', {
              method: 'POST',
              body: {
                message: processedMessage,
                sessionToken: this.sessionToken,
                articleDraft: processedDraft,
                images,
                messageHistory: this.messages.map(msg => ({
                  role: msg.role,
                  content: msg.content,
                  timestamp: msg.timestamp
                }))
              }
            })
          } catch (error: any) {
            console.error(`[AiAgent] Request failed (attempt ${retryCount + 1}):`, error)
            
            // Проверяем, является ли ошибка связанной с токеном
            const isTokenError = error.data?.error?.type === 'session_error' || 
                               error.data?.error?.type === 'configuration_error' ||
                               error.status === 401 ||
                               error.data?.message?.includes('Invalid session token') ||
                               error.data?.message?.includes('Session token is required')
            
            if (isTokenError && retryCount < 3) {
              console.log('[AiAgent] Token error detected, automatically regenerating token and retrying...')
              
              try {
                // Генерируем новый токен
                await this.generateToken()
                
                // Повторяем запрос с новым токеном
                return await sendRequestWithAutoRecovery(retryCount + 1)
              } catch (retryError) {
                console.error('[AiAgent] Failed to regenerate token:', retryError)
                
                // Если не удалось сгенерировать токен, пробуем еще раз
                if (retryCount < 2) {
                  console.log('[AiAgent] Retrying token generation...')
                  return await sendRequestWithAutoRecovery(retryCount + 1)
                }
                
                throw retryError
              }
            }
            
            // Если это не ошибка токена или превышено количество попыток, возвращаем дружественное сообщение
            if (retryCount >= 3) {
              console.log('[AiAgent] Max retries reached, returning friendly error message')
              return {
                answer: "I'm having trouble processing your message right now. Please try again in a moment.",
                error: {
                  type: 'max_retries_exceeded',
                  message: 'Maximum retry attempts reached',
                  shouldReset: false
                }
              }
            }
            
            throw error
          }
        }

        const response = await sendRequestWithAutoRecovery()

        // Обрабатываем ответ AI, восстанавливая изображения
        let aiResponse = response.answer
        if (images.length > 0) {
          images.forEach(({ id, data }) => {
            aiResponse = aiResponse.replace(`[image:${id}]`, data)
          })
        }

        const assistantMessage = {
          role: 'assistant' as const,
          content: aiResponse,
          timestamp: new Date().toISOString(),
          user: {
            id: 'assistant',
            email: 'ai@assistant.com',
            avatar: '/images/ai-avatar.png',
            displayName: 'AI Assistant'
          }
        }

        // Добавляем сообщение ассистента
        this.messages = [...this.messages, assistantMessage]
        saveState({ messages: this.messages })

        // Обновляем схему статьи, если она есть (без добавления в сообщение)
        if (response.schema) {
          console.log('[AiAgent] Received schema update:', response.schema)
          articleBuilderStore.updateDraft(response.schema, true)
        }

        return aiResponse
      } catch (error: any) {
        console.error('[AiAgent] Failed to send message to AI agent:', error)
        
        // Добавляем дружественное сообщение об ошибке в чат
        const errorMessage = {
          role: 'assistant' as const,
          content: "I'm having trouble processing your message right now. Please try again in a moment.",
          timestamp: new Date().toISOString(),
          user: {
            id: 'assistant',
            email: 'ai@assistant.com',
            avatar: '/images/ai-avatar.png',
            displayName: 'AI Assistant'
          }
        }
        
        this.messages = [...this.messages, errorMessage]
        saveState({ messages: this.messages })
        
        // Возвращаем дружественное сообщение вместо выброса ошибки
        return "I'm having trouble processing your message right now. Please try again in a moment."
      } finally {
        this.isProcessing = false
      }
    },

    clearSession() {
      console.log('[AiAgent] Clearing session')
      this.sessionToken = null
      this.messages = []
      saveState({ sessionToken: null, messages: [] })
    },

    // Функция для принудительного обновления токена
    async refreshToken() {
      console.log('[AiAgent] Forcing token refresh')
      this.sessionToken = null
      saveState({ sessionToken: null })
      return await this.generateToken()
    }
  }
})
