import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    showLoginModal: false,
    showRegisterModal: false
  }),

  actions: {
    openLogin() {
      this.showRegisterModal = false
      setTimeout(() => {
        this.showLoginModal = true
      }, 150)
    },

    openRegister() {
      this.showLoginModal = false
      setTimeout(() => {
        this.showRegisterModal = true
      }, 150)
    },

    closeModals() {
      this.showLoginModal = false
      this.showRegisterModal = false
    }
  }
}) 