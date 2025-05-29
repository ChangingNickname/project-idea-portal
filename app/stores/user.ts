import { defineStore } from 'pinia'


export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
  }),

  actions: {
    setUser(user: User) {
      this.user = user
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(user))
      // Save to sessionStorage
      sessionStorage.setItem('user', JSON.stringify(user))
    },

    clearUser() {
      this.user = null
      localStorage.removeItem('user')
      sessionStorage.removeItem('user')
    },

    // Initialize store from storage
    initializeFromStorage() {
      // Try to get from sessionStorage first, then localStorage
      const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user')
      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser)
        } catch (e) {
          console.error('Failed to parse stored user data:', e)
          this.clearUser()
        }
      }
    }
  },

  getters: {
    isAuthenticated: (state) => !!state.user,
    getUser: (state) => state.user,
  }
}) 