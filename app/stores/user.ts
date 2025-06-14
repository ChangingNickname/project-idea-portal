import { defineStore } from 'pinia'
import { checkStoredUser, onAuthStateChanged } from '~/utils/firebase/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    loading: true
  }),

  getters: {
    isAuthenticated: (state) => !!state.user
  },

  actions: {
    async init() {
      // Check localStorage first
      const storedUser = checkStoredUser()
      if (storedUser) {
        this.user = storedUser
      }

      // Listen to auth state changes
      onAuthStateChanged((user) => {
        this.user = user
        this.loading = false
      })
    },

    setUser(user: User | null) {
      this.user = user
    },

    updateUser(userData: Partial<User>) {
      if (!this.user) {
        console.error('No user to update')
        return
      }

      // Создаем новый объект пользователя с безопасным обновлением контактов
      const updatedUser = {
        ...this.user,
        ...userData,
        contacts: {
          ...this.user.contacts,
          ...(userData.contacts || {}),
          email: this.user.email // Всегда используем email из текущего пользователя
        }
      }

      // Ensure required fields are present
      if (userData.displayName !== undefined) updatedUser.displayName = userData.displayName
      if (userData.position !== undefined) updatedUser.position = userData.position
      if (userData.avatar !== undefined) updatedUser.avatar = userData.avatar

      this.user = updatedUser
    },

    clearUser() {
      this.user = null
    }
  }
}) 