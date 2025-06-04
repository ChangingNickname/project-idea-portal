import { defineStore } from 'pinia'
import { useArticleBuilderStore } from '~/stores/articleBuilder'

interface AiAgentState {
  sessionToken: string | null
  isProcessing: boolean
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
}

const welcomeMessage = {
  role: 'assistant' as const,
  content: 'Привет! Я ваш AI ассистент. Я готов помочь вам с вашими вопросами и задачами. Как я могу вам помочь сегодня?',
  timestamp: new Date().toISOString()
}

export const useAiAgentStore = defineStore('aiagent', {
  state: (): AiAgentState => ({
    sessionToken: null,
    isProcessing: false,
    messages: [welcomeMessage]
  }),

  actions: {
    async generateToken() {
      try {
        const response = await $fetch<{ token: string }>('/api/aiagent/token.generate')
        this.sessionToken = response.token
        return response.token
      } catch (error) {
        console.error('Failed to generate AI agent token:', error)
        throw error
      }
    },

    async sendMessage(message: string) {
      if (!this.sessionToken) {
        await this.generateToken()
      }

      const articleBuilderStore = useArticleBuilderStore()
      
      try {
        this.isProcessing = true
        this.messages.push({
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        })

        const response = await $fetch<{ response: string }>('/api/aiagent', {
          method: 'POST',
          body: {
            message,
            sessionToken: this.sessionToken,
            articleDraft: articleBuilderStore.draft
          }
        })

        this.messages.push({
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString()
        })

        return response.response
      } catch (error) {
        console.error('Failed to send message to AI agent:', error)
        throw error
      } finally {
        this.isProcessing = false
      }
    },

    clearSession() {
      this.sessionToken = null
      this.messages = [welcomeMessage]
    }
  }
})
