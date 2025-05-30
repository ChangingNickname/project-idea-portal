import { defineStore } from 'pinia'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    loading: false,
    error: null as string | null
  }),

  actions: {
    async updateProfile(user: User) {
      this.loading = true
      this.error = null
      
      try {
        // TODO: Implement actual API call
        console.log('Updating profile:', user)
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        return user
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update profile'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
}) 