<template>
  <div class="relative" ref="dropdownRef">
    <UButton
      color="neutral"
      variant="ghost"
      class="relative"
      @click="isOpen = !isOpen"
    >
      <UserAvatar
        email="test@example.com"
        :isActive="true"
      />
    </UButton>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
    >
      <!-- User Info -->
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <UserAvatar
            email="test@example.com"
            size="sm"
          />
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Test User</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">test@example.com</p>
          </div>
        </div>
      </div>

      <!-- Navigation Links -->
      <div class="py-1">
        <button
          v-for="link in navigationLinks"
          :key="link.path"
          class="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          @click="handleNavigation(link.path)"
        >
          <UIcon :name="link.icon" class="w-4 h-4" />
          {{ link.label }}
        </button>
      </div>

      <!-- Settings -->
      <div class="py-1 border-t border-gray-200 dark:border-gray-700">
        <button
          class="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          @click="handleNavigation('/profile')"
        >
          <UIcon name="i-lucide-user" class="w-4 h-4" />
          Profile
        </button>
        <button
          class="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          @click="toggleTheme"
        >
          <UIcon :name="colorMode === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'" class="w-4 h-4" />
          {{ colorMode === 'dark' ? 'Light Mode' : 'Dark Mode' }}
        </button>
        <button data-language-button
          class="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          @click="openLanguageModal"
        >
          <UIcon name="i-lucide-globe" class="w-4 h-4" />
          Language
        </button>
      </div>

      <!-- Logout -->
      <div class="py-1 border-t border-gray-200 dark:border-gray-700">
        <button
          class="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          @click="handleLogout"
        >
          <UIcon name="i-lucide-log-out" class="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  </div>

  <SettingsLanguageSelect v-model="isLanguageModalOpen" />
</template>

<script setup lang="ts">
import { useColorMode, onClickOutside } from '@vueuse/core'
import { useRouter } from 'vue-router'

// import { useUserStore } from '~/stores/user'
// const userStore = useUserStore()

const router = useRouter()
const colorMode = useColorMode()
const isLanguageModalOpen = ref(false)
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const navigationLinks = [
  {
    label: 'Posts',
    icon: 'i-lucide-file-text',
    path: '/posts'
  },
  {
    label: 'Mails',
    icon: 'i-lucide-mail',
    path: '/mails'
  },
  {
    label: 'Article Builder',
    icon: 'i-lucide-pen-tool',
    path: '/article-builder'
  }
]

const handleNavigation = (path: string) => {
  console.log('Navigating to:', path)
  router.push(path)
  isOpen.value = false
}

const toggleTheme = () => {
  console.log('Theme toggle clicked, current mode:', colorMode.value)
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
  console.log('New theme mode:', colorMode.value)
  isOpen.value = false
}

const openLanguageModal = () => {
  console.log('Language selection clicked')
  isLanguageModalOpen.value = true
  isOpen.value = false
}

const handleLogout = () => {
  console.log('Logout clicked')
  // userStore.clearUser()
  router.push('/')
  isOpen.value = false
}

// Close dropdown when clicking outside
onClickOutside(dropdownRef, () => {
  isOpen.value = false
})
</script>
