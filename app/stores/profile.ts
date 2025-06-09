import { defineStore } from 'pinia'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    loading: false,
    error: null as string | null
  }),

  actions: {
    async updateProfile(userData: Partial<User>, userId: string) {
      if (!userId) {
        this.error = 'Invalid user ID'
        throw new Error('Invalid user ID')
      }

      this.loading = true
      this.error = null
      
      try {
        const response = await $fetch(`/api/user/${userId}/profile`, {
          method: 'POST',
          body: userData
        })
        
        return response
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update profile'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
}) 