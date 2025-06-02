import { defineStore } from 'pinia'

interface UnreadCount {
  [userId: string]: number
}

export const useUnreadMessagesStore = defineStore('unreadMessages', {
  state: () => ({
    unreadCounts: {} as UnreadCount,
    totalUnread: 0,
    checkInterval: null as NodeJS.Timeout | null
  }),

  actions: {
    async checkUnreadMessages() {
      try {
        const response = await $fetch<{ [userId: string]: number }>('/api/user/unread-messages')
        this.unreadCounts = response
        this.totalUnread = Object.values(response).reduce((sum, count) => sum + count, 0)
      } catch (error) {
        console.error('Error checking unread messages:', error)
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
    }
  }
}) 