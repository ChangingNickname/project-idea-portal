<template>
  <div class="flex items-center gap-4">
    <template v-if="!userStore">
      <USkeleton class="h-8 w-8 rounded-full" />
    </template>
    
    <template v-else-if="userStore.loading">
      <USkeleton class="h-8 w-8 rounded-full" />
    </template>
    
    <template v-else-if="userStore.isAuthenticated">
      <UDropdown :items="menuItems">
        <UButton
          color="neutral"
          variant="ghost"
          class="relative"
        >
          <template #leading>
            <UAvatar
              :src="userStore.user?.avatar || undefined"
              :alt="userStore.user?.displayName || 'User'"
              size="sm"
            />
          </template>
          <span class="ml-2">{{ userStore.user?.displayName || 'User' }}</span>
        </UButton>
      </UDropdown>
    </template>
    
    <template v-else>
      <UButton
        color="primary"
        variant="soft"
        @click="showLoginModal = true"
      >
        Sign in
      </UButton>
    </template>

    <UserLogin 
      v-model="showLoginModal" 
      @open-register="openRegister"
    />
    <UserRegister 
      v-model="showRegisterModal" 
      @open-login="openLogin"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '~/stores/user'
import { signOut } from '~/utils/firebase/auth'

const userStore = useUserStore()
const showLoginModal = ref(false)
const showRegisterModal = ref(false)

const openLogin = () => {
  showRegisterModal.value = false
  showLoginModal.value = true
}

const openRegister = () => {
  showLoginModal.value = false
  showRegisterModal.value = true
}

const menuItems = [
  [
    {
      label: 'Profile',
      icon: 'i-heroicons-user-circle',
      to: '/profile'
    },
    {
      label: 'Settings',
      icon: 'i-heroicons-cog-6-tooth',
      to: '/settings'
    }
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-heroicons-arrow-right-on-rectangle',
      click: async () => {
        await signOut()
        userStore.clearUser()
      }
    }
  ]
]
</script> 