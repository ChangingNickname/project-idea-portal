import { defineStore } from 'pinia'
import { useUserStore } from '~/stores/user'
import { useRoute } from 'vue-router'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    loading: false,
    error: null as string | null
  }),

  actions: {
    async updateProfile(user: User) {
      const route = useRoute()
      const userId = route.params.uid

      if (!userId) {
        this.error = 'Invalid user ID'
        throw new Error('Invalid user ID')
      }

      this.loading = true
      this.error = null
      
      try {
        const response = await $fetch(`/api/user/${userId}/profile`, {
          method: 'POST',
          body: user
        })

        // Обновляем данные в userStore
        const userStore = useUserStore()
        if (response?.profile) {
          userStore.updateUser(response.profile)
        }
        
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