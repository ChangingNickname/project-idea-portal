import { defineStore } from 'pinia'

interface UnreadCount {
  [userId: string]: number
}

interface ApiError {
  statusCode: number
  message: string
}

export const useUnreadMessagesStore = defineStore('unreadMessages', {
  state: () => ({
    unreadCounts: {} as UnreadCount,
    totalUnread: 0,
    checkInterval: null as NodeJS.Timeout | null,
    isChecking: false,
    lastError: null as Error | null
  }),

  actions: {
    async checkUnreadMessages() {
      if (this.isChecking) return
      
      this.isChecking = true
      this.lastError = null
      
      try {
        const response = await $fetch<{ [userId: string]: number }>('/api/user/unread-messages')
        this.unreadCounts = response
        this.totalUnread = Object.values(response).reduce((sum, count) => sum + count, 0)
      } catch (error: unknown) {
        console.error('Error checking unread messages:', error)
        this.lastError = error instanceof Error ? error : new Error(String(error))
        
        // Если ошибка авторизации, останавливаем проверку
        if (error && typeof error === 'object' && 'statusCode' in error) {
          const apiError = error as ApiError
          if (apiError.statusCode === 401) {
            this.stopPeriodicCheck()
          }
        }
      } finally {
        this.isChecking = false
      }
    },

    startPeriodicCheck() {
      if (this.checkInterval) return

      // Проверяем сразу при старте
      this.checkUnreadMessages()

      // Затем каждую минуту
      this.checkInterval = setInterval(() => {
        this.checkUnreadMessages()
      }, 60000)
    },

    stopPeriodicCheck() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval)
        this.checkInterval = null
      }
    },

    getUnreadCount(userId: string): number {
      return this.unreadCounts[userId] || 0
    },

    reset() {
      this.unreadCounts = {}
      this.totalUnread = 0
      this.lastError = null
      this.stopPeriodicCheck()
    }
  }
}) 