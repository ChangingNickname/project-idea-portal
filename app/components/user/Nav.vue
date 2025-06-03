<template>
  <div class="relative" ref="dropdownRef">
    <UButton
      color="neutral"
      variant="ghost"
      class="relative"
      @click="isOpen = !isOpen"
    >
      <div class="relative">
        <Avatar
          :src="user?.avatar || undefined"
          :email="user?.email || undefined"
          :alt="user?.displayName || user?.email || ''"
          :isActive="true"
        />
        <UChip
          v-if="totalUnread > 0"
          :text="totalUnread"
          size="3xl"
          class="absolute -top-2 -right-2"
        />
      </div>
    </UButton>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
    >
      <!-- User Info -->
      <button
        type="button"
        class="w-full text-left px-4 py-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer relative group focus:outline-none"
        @click="handleNavigation(`/user/${user?.id}/profile`)"
        :title="$t('common.profile')"
      >
        <div class="flex items-center gap-3">
          <Avatar
            :src="user?.avatar || undefined"
            :email="user?.email || undefined"
            :alt="user?.displayName || user?.email || ''"
            size="sm"
          />
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ user?.displayName || 'Anonymous User' }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ truncateEmail(user?.email) }}</p>
          </div>
        </div>
        <span class="absolute top-3 right-3 opacity-70 group-hover:opacity-100 transition-opacity">
          <UIcon name="i-lucide-external-link" class="w-4 h-4" />
        </span>
      </button>

      <!-- Navigation Links -->
      <div class="py-1">
        <button
          v-for="link in navigationLinks"
          :key="link.path"
          class="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          @click="handleNavigation(link.path)"
        >
          <div class="relative">
            <UIcon :name="link.icon" class="w-4 h-4" />
            <UChip
              v-if="link.path === '/mails' && totalUnread > 0"
              :text="totalUnread"
              size="3xl"
              class="absolute -top-2 -right-2"
            />
          </div>
          {{ link.label }}
        </button>
      </div>

      <!-- Settings -->
      <div class="py-1 border-t border-gray-200 dark:border-gray-700">
        <button
          class="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          @click="toggleTheme"
        >
          <ClientOnly>
            <template #default>
              <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="w-4 h-4" />
              {{ isDark ? $t('common.lightMode') : $t('common.darkMode') }}
            </template>
            <template #fallback>
              <UIcon name="i-lucide-moon" class="w-4 h-4" />
              {{ $t('common.darkMode') }}
            </template>
          </ClientOnly>
        </button>
        <button data-language-button
          class="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          @click="openLanguageModal"
        >
          <UIcon name="i-lucide-globe" class="w-4 h-4" />
          {{ $t('common.selectLanguage') }}
        </button>
      </div>

      <!-- Logout -->
      <div class="py-1 border-t border-gray-200 dark:border-gray-700">
        <button
          class="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          @click="handleLogout"
        >
          <UIcon name="i-lucide-log-out" class="w-4 h-4" />
          {{ $t('common.logout') }}
        </button>
      </div>
    </div>
  </div>

  <SettingsLanguageSelect v-model="isLanguageModalOpen" />
</template>

<script setup lang="ts">
import { useColorMode, onClickOutside } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useUserStore } from '~/stores/user'
import { signOut } from '~/utils/firebase/auth'
import Avatar from '~/components/user/Avatar.vue'
import { useUnreadMessagesStore } from '~/stores/unreadMessages'

const router = useRouter()
const colorMode = useColorMode()
const isLanguageModalOpen = ref(false)
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const { t } = useI18n()
const userStore = useUserStore()
const unreadStore = useUnreadMessagesStore()
const toast = useToast()
const previousUnreadCount = ref(0)

// Используем computed для получения пользователя
const user = computed<User | null>(() => userStore.user)
const isDark = computed(() => colorMode.value === 'dark')

const truncateEmail = (email: string | null | undefined, maxLength = 10) => {
  if (!email) return t('common.noEmail')
  if (email.length <= maxLength) return email
  
  const atIndex = email.indexOf('@')
  if (atIndex === -1) return email
  
  const username = email.slice(0, atIndex)
  const domain = email.slice(atIndex)
  
  if (username.length <= maxLength - 3) return email
  
  const truncatedUsername = username.slice(0, maxLength - 3) + '...'
  return `${truncatedUsername}${domain}`
}

const navigationLinks = computed(() => [
  {
    label: t('navigation.posts'),
    icon: 'i-lucide-file-text',
    path: '/my/posts'
  },
  {
    label: t('navigation.mails'),
    icon: 'i-lucide-mail',
    path: '/my/mails'
  },
])

const handleNavigation = (path: string) => {
  router.push(path)
  isOpen.value = false
}

const toggleTheme = () => {
  colorMode.value = isDark.value ? 'light' : 'dark'
  isOpen.value = false
}

const openLanguageModal = () => {
  isLanguageModalOpen.value = true
  isOpen.value = false
}

const handleLogout = async () => {
  try {
    await signOut()
    userStore.clearUser()
    router.push('/')
  } catch (error) {
    console.error('Error during logout:', error)
  } finally {
    isOpen.value = false
  }
}

// Close dropdown when clicking outside
onClickOutside(dropdownRef, () => {
  isOpen.value = false
})

// Следим за изменениями количества непрочитанных сообщений
watch(() => unreadStore.totalUnread, (newCount, oldCount) => {
  if (newCount > oldCount && oldCount > 0) {
    toast.add({
      title: t('common.newMessages'),
      description: t('common.unreadMessages', { count: newCount }),
      color: 'primary',
      icon: 'i-lucide-mail',
      onClick: () => {
        router.push('/mails')
      }
    })
  }
})

// Запускаем проверку непрочитанных сообщений при монтировании
onMounted(() => {
  unreadStore.startPeriodicCheck()
  previousUnreadCount.value = unreadStore.totalUnread
})

// Останавливаем проверку при размонтировании
onUnmounted(() => {
  unreadStore.stopPeriodicCheck()
})

// Получаем общее количество непрочитанных сообщений
const totalUnread = computed(() => unreadStore.totalUnread)
</script>
