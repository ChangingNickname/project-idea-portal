<template>
  <div class="container mx-auto p-4">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t('navigation.mails') }}</h1>
      
      <!-- Search -->
      <UInput
        v-model="searchQuery"
        :placeholder="t('common.searchByNameOrEmail')"
        icon="i-lucide-search"
        class="w-64"
        :loading="pending"
        @input="debouncedSearch"
      />
    </div>

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
        <NuxtLink :to="`/user/${chat.userId}/chat`" class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <UserAvatar
              :src="chat.user.avatar"
              :email="chat.user.email"
              :alt="chat.user.displayName"
              :isActive="chat.user.emailVerified"
              size="md"
            />
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ chat.user.displayName || chat.user.email }}
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ chat.lastMessage?.message || $t('chat.noMessages') }}
              </p>
            </div>
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
            <UIcon name="i-lucide-external-link" class="w-4 h-4 text-gray-400" />
          </div>
        </NuxtLink>
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
        <template v-else>
          <p class="text-gray-500 dark:text-gray-400">
            {{ $t('chat.allMessages') }}
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useUnreadMessagesStore } from '~/stores/unreadMessages'
import { useI18n } from 'vue-i18n'

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
const searchQuery = ref('')
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

  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(chat => 
      chat.user.displayName?.toLowerCase().includes(query) ||
      chat.user.email.toLowerCase().includes(query)
    )
  }

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
    const response = await $fetch<{
      chats: Chat[]
      pagination: {
        total: number
        page: number
        limit: number
        pages: number
      }
    }>('/api/user/chats', {
      query: {
        page: currentPage.value,
        limit: itemsPerPage.value,
        search: searchQuery.value,
        sortBy: sortBy.value,
        sortDirection: sortDirection.value
      }
    })
    
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

// Debounce search
const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1 // Reset page on search
  loadChats()
}, 300)

const handleSortChange = (value: string) => {
  sortBy.value = value
}

const getSortIcon = (value: string) => {
  return sortOptions.find(option => option.value === value)?.icon || 'i-lucide-clock'
}

const getSortLabel = (value: string) => {
  return sortOptions.find(option => option.value === value)?.label || t('common.sortByMessageDate')
}

onMounted(() => {
  loadChats()
  unreadStore.startPeriodicCheck()
})
</script>
