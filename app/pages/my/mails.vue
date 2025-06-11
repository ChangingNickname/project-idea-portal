<template>
  <div class="container mx-auto p-4">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t('navigation.mails') }}</h1>
      
      <!-- New Chat Button -->
      <UButton
        color="primary"
        icon="i-lucide-plus"
        @click="showUserSearch = true"
      >
        {{ t('common.newChat') }}
      </UButton>
    </div>

    <!-- User Search Modal -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="showUserSearch" class="fixed inset-0 z-50 flex items-center justify-center p-16">
        <div
          class="fixed inset-0 bg-black/50"
          @click="showUserSearch = false"
        />

        <div
          class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto"
        >
          <button
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            @click="showUserSearch = false"
          >
            <UIcon name="i-lucide-x" class="w-6 h-6" />
          </button>

          <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white pr-8">
            {{ t('common.newChat') }}
          </h2>

          <UserSearch
            :multiple="false"
            @select="handleStartChat"
          />
        </div>
      </div>
    </Transition>

    <!-- Filters and sorting -->
    <div class="flex items-center gap-4 mb-6">
      <UDropdownMenu
        :items="sortOptions"
        :model-value="sortBy"
        class="w-64"
        @update:model-value="handleSortChange"
      >
        <UButton
          color="neutral"
          variant="soft"
          class="w-64 justify-between"
        >
          <div class="flex items-center gap-2">
            <UIcon :name="getSortIcon(sortBy)" class="w-4 h-4" />
            <span>{{ getSortLabel(sortBy) }}</span>
          </div>
          <UIcon name="i-lucide-chevron-down" class="w-4 h-4" />
        </UButton>
      </UDropdownMenu>
      <UButton
        :icon="sortDirection === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
        color="neutral"
        variant="ghost"
        @click="toggleSortDirection"
      />
    </div>

    <div class="space-y-4">
      <div v-if="pending" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin" />
      </div>

      <div v-else-if="!filteredChats.length" class="text-center text-gray-500 py-4">
        {{ searchQuery ? t('common.noChatsFound') : t('common.noActiveChats') }}
      </div>

      <div v-else v-for="chat in filteredChats" :key="chat.userId" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <UserCard 
              :user="{
                id: chat.user.id,
                email: chat.user.email,
                displayName: chat.user.displayName || chat.user.email,
                avatar: chat.user.avatar || null,
                emailVerified: chat.user.emailVerified,
                position: null,
                disabled: false,
                isAnonymous: false,
                providerData: [],
                contacts: {
                  email: chat.user.email,
                  phone: null,
                  telegram: null,
                  whatsapp: null,
                  viber: null,
                  discord: null,
                  linkedin: null,
                  github: null,
                  website: null
                },
                customClaims: null,
                metadata: {
                  creationTime: null,
                  lastSignInTime: null,
                  lastRefreshTime: null
                },
                tenantId: null,
                multiFactor: null
              }" 
            />
          </div>
          <div class="flex items-center gap-4">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(chat.lastMessage?.created_at) }}
            </div>
            <UChip
              v-if="unreadCount(chat.userId) > 0"
              :text="unreadCount(chat.userId)"
              size="3xl"
            />
            <NuxtLink :to="`/user/${chat.userId}/chat`" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <UIcon name="i-lucide-external-link" class="w-4 h-4" />
            </NuxtLink>
          </div>
        </div>
        <div v-if="chat.lastMessage" class="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {{ chat.lastMessage.message }}
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex justify-center mt-6">
        <template v-if="pagination.pages > 1">
          <UPagination
            v-model="currentPage"
            :total="pagination.total"
            :page-count="pagination.pages"
            :items-per-page="itemsPerPage"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from '#imports'
import { useDebounceFn } from '@vueuse/core'
import { useUnreadMessagesStore } from '~/stores/unreadMessages'
import UserCard from '~/components/user/Card.vue'
import Avatar from '~/components/user/Avatar.vue'
import UserSearch from '~/components/user/search.vue'
import { z } from 'zod'

const { t } = useI18n()

interface ChatUser {
  id: string
  email: string
  displayName: string | null
  avatar: string | null
  emailVerified: boolean
}

interface LastMessage {
  id: string
  message: string
  created_at: string
}

interface Chat {
  userId: string
  user: ChatUser
  lastMessage: LastMessage | null
}

const chats = ref<Chat[]>([])
const unreadStore = useUnreadMessagesStore()
const pending = ref(false)
const sortBy = ref('lastMessage')
const sortDirection = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const itemsPerPage = ref(20)
const pagination = ref({
  total: 0,
  page: 1,
  limit: 20,
  pages: 1
})
const showUserSearch = ref(false)

const sortOptions = [
  { 
    label: t('common.sortByMessageDate'), 
    value: 'lastMessage',
    icon: 'i-lucide-clock'
  },
  { 
    label: t('common.sortByName'), 
    value: 'name',
    icon: 'i-lucide-user'
  },
  { 
    label: t('common.sortByEmail'), 
    value: 'email',
    icon: 'i-lucide-mail'
  },
  { 
    label: t('common.sortByUnread'), 
    value: 'unread',
    icon: 'i-lucide-message-circle'
  }
]

// Get unread messages count for user
const unreadCount = (userId: string) => unreadStore.getUnreadCount(userId)

// Format date
const formatDate = (date: string | undefined) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

// Filter and sort chats
const filteredChats = computed(() => {
  let result = [...chats.value]

  // Исключаем чат с AI ассистентом
  result = result.filter(chat => chat.userId !== 'assistant')

  // Sort
  result.sort((a, b) => {
    let comparison = 0

    switch (sortBy.value) {
      case 'name':
        comparison = (a.user.displayName || a.user.email)
          .localeCompare(b.user.displayName || b.user.email)
        break
      case 'email':
        comparison = a.user.email.localeCompare(b.user.email)
        break
      case 'unread':
        comparison = unreadCount(b.userId) - unreadCount(a.userId)
        break
      case 'lastMessage':
      default:
        const dateA = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0
        const dateB = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0
        comparison = dateB - dateA
        break
    }

    return sortDirection.value === 'asc' ? comparison : -comparison
  })

  return result
})

// Toggle sort direction
const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}

// Load chats list
const loadChats = async () => {
  pending.value = true
  try {
    const query: any = {
      page: currentPage.value,
      limit: itemsPerPage.value,
      sortBy: sortBy.value,
      sortDirection: sortDirection.value
    }

    const response = await $fetch<{
      chats: Chat[]
      pagination: {
        total: number
        page: number
        limit: number
        pages: number
      }
    }>('/api/user/chats', { query })
    
    chats.value = response.chats
    pagination.value = response.pagination
  } catch (error) {
    console.error('Error loading chats:', error)
  } finally {
    pending.value = false
  }
}

// Watch for parameter changes
watch([currentPage, sortBy, sortDirection], () => {
  loadChats()
})

const handleSortChange = (value: string) => {
  sortBy.value = value
}

const getSortIcon = (value: string) => {
  return sortOptions.find(option => option.value === value)?.icon || 'i-lucide-clock'
}

const getSortLabel = (value: string) => {
  return sortOptions.find(option => option.value === value)?.label || t('common.sortByMessageDate')
}

const searchQuery = ref('')
const users = ref<User[]>([])
const pendingUsers = ref(false)
const errorUsers = ref<Error | null>(null)

// Search users
const searchUsers = async () => {
  if (!searchQuery.value) {
    users.value = []
    return
  }

  pendingUsers.value = true
  errorUsers.value = null

  try {
    const response = await $fetch<{
      users: User[]
      pagination: {
        total: number
        page: number
        limit: number
        pages: number
      }
    }>('/api/user/search', {
      query: {
        q: searchQuery.value,
        page: 1,
        limit: 10
      }
    })

    users.value = response.users
  } catch (e) {
    errorUsers.value = e as Error
    console.error('Error searching users:', e)
  } finally {
    pendingUsers.value = false
  }
}

// Debounce user search
const debouncedUserSearch = useDebounceFn(() => {
  searchUsers()
}, 300)

// Start chat with selected user
const handleStartChat = async (users: string[]) => {
  if (users.length > 0) {
    navigateTo(`/user/${users[0]}/chat`)
    showUserSearch.value = false
  }
}

onMounted(() => {
  loadChats()
  unreadStore.startPeriodicCheck()
})
</script>
