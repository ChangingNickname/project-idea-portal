import { defineStore } from 'pinia'
import type { User } from '~/types/user'
import { checkStoredUser, onAuthStateChanged } from '~/utils/firebase/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    loading: true
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAnonymous: (state) => state.user?.isAnonymous || false
  },

  actions: {
    async init() {
      // Check localStorage first
      const storedUser = checkStoredUser()
      if (storedUser) {
        this.user = storedUser
      }

      // Listen to auth state changes
      onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          this.user = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            isAnonymous: firebaseUser.isAnonymous,
            metadata: {
              creationTime: firebaseUser.metadata.creationTime || null,
              lastSignInTime: firebaseUser.metadata.lastSignInTime || null
            }
          }
        } else {
          this.user = null
        }
        this.loading = false
      })
    },

    setUser(user: User | null) {
      this.user = user
    },

    clearUser() {
      this.user = null
    }
  }
}) 