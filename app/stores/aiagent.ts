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
        const response = await $fetch<{ token: string }>('/api/aiagent/token.generate')
        this.sessionToken = response.token
        saveState({ sessionToken: response.token })
        return response.token
      } catch (error) {
        console.error('Failed to generate AI agent token:', error)
        throw error
      }
    },

    async sendMessage(message: string): Promise<string> {
      console.log('sendMessage called with:', message)
      
      if (!message) {
        console.log('Empty message, skipping')
        return ''
      }

      const articleBuilderStore = useArticleBuilderStore()
      const userStore = useUserStore()

      // Check if post is published and user is not the owner
      if (articleBuilderStore.draft.status === 'published' && 
          articleBuilderStore.draft.ownerId !== userStore.user?.id) {
        console.log('Cannot interact with published post')
        throw new Error('Cannot interact with published post')
      }

      if (!this.sessionToken) {
        console.log('No session token, generating new one')
        await this.generateToken()
      }

      // Проверяем, не отправляется ли уже сообщение
      if (this.isProcessing) {
        console.log('Message is already being processed in store')
        return ''
      }

      try {
        this.isProcessing = true
        console.log('Store processing message:', message)

        // Проверяем, не было ли уже отправлено такое сообщение
        const lastMessage = this.messages[this.messages.length - 1]
        if (lastMessage?.role === 'user' && lastMessage.content === message) {
          console.log('Duplicate message detected in store, skipping')
          return ''
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

        console.log('Adding user message to store:', userMessage)
        this.messages = [...this.messages, userMessage]
        saveState({ messages: this.messages })

        console.log('Sending to API:', {
          message: processedMessage,
          sessionToken: this.sessionToken,
          imagesCount: images.length
        })

        const response = await $fetch<{ answer: string; schema: any }>('/api/aiagent', {
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
          console.log('Received schema update:', response.schema)
          articleBuilderStore.updateDraft(response.schema, true)
        }

        return aiResponse
      } catch (error: any) {
        console.error('Failed to send message to AI agent:', error)
        
        // Проверяем, является ли ошибка связанной с невалидным токеном
        if (error.data?.message?.includes('Invalid session token')) {
          console.log('Invalid session token detected, generating new one')
          try {
            // Генерируем новый токен
            await this.generateToken()
            
            // Повторяем отправку сообщения с новым токеном
            console.log('Retrying message send with new token')
            return await this.sendMessage(message)
          } catch (retryError) {
            console.error('Failed to retry with new token:', retryError)
            throw retryError
          }
        }
        
        throw error
      } finally {
        this.isProcessing = false
      }
    },

    clearSession() {
      this.sessionToken = null
      this.messages = []
      saveState({ sessionToken: null, messages: [] })
    }
  }
})
