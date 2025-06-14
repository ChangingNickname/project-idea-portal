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
    async fetchUserProfile(userId: string) {
      if (!userId) return
      try {
        const profile = await $fetch(`/api/user/${userId}/profile`)
        this.user = profile
      } catch (e) {
        console.error('Ошибка загрузки профиля:', e)
      }
    },

    async init() {
      // Check localStorage first
      const storedUser = checkStoredUser()
      if (storedUser) {
        this.user = storedUser
        // Подгружаем актуальный профиль
        await this.fetchUserProfile(storedUser.id)
      }

      // Listen to auth state changes
      onAuthStateChanged(async (user) => {
        this.loading = false
        if (user && user.id) {
          await this.fetchUserProfile(user.id)
        } else {
          this.user = null
        }
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