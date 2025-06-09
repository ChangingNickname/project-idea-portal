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

    updateUser(user: User) {
      if (!user?.id) {
        console.error('Invalid user data in updateUser')
        return
      }

      if (!this.user) {
        this.user = user
        return
      }

      if (this.user.id === user.id) {
        this.user = {
          ...this.user,
          ...user
        }
      }
    },

    clearUser() {
      this.user = null
    }
  }
}) 