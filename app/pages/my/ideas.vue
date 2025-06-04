<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('common.myPosts') }}</h1>
      
      <!-- Search -->
      <UInput
        v-model="searchQuery"
        :placeholder="t('common.searchByTitleOrId')"
        icon="i-lucide-search"
        class="w-64"
        :loading="loading"
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
      <UButton
        color="primary"
        variant="soft"
        @click="handleNewProject"
      >
        <Icon name="lucide:plus" class="w-5 h-5 mr-2" />
        {{ t('common.createProject') }}
      </UButton>
    </div>

    <!-- Posts where user is owner or author -->
    <div class="mb-12">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        {{ t('common.myProjects') }}
      </h2>

      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin" />
      </div>

      <div v-else-if="myPosts.length === 0" class="text-center py-12">
        <div class="text-gray-500 dark:text-gray-400">
          <Icon name="lucide:file-question" class="w-12 h-12 mx-auto mb-4" />
          <p>{{ t('common.noProjects') }}</p>
          <UButton
            color="primary"
            variant="soft"
            class="mt-4"
            @click="handleNewProject"
          >
            {{ t('common.createFirstProject') }}
          </UButton>
        </div>
      </div>

      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="post in myPosts" :key="post.id" class="relative">
            <PostsCard :post="post" />
            <div class="mt-2 text-right">
              <UButton
                :to="`/article-builder?id=${post.id}`"
                color="primary"
                variant="soft"
                class="inline-flex items-center"
              >
                <Icon name="lucide:edit" class="w-5 h-5 mr-2" />
                {{ t('common.edit') }}
              </UButton>
            </div>
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

    <!-- Posts where user is participant -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        {{ t('common.projectsWhereIParticipate') }}
      </h2>

      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin" />
      </div>

      <div v-else-if="participantPosts.length === 0" class="text-center py-12">
        <div class="text-gray-500 dark:text-gray-400">
          <Icon name="lucide:users" class="w-12 h-12 mx-auto mb-4" />
          <p>{{ t('common.notParticipating') }}</p>
        </div>
      </div>

      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="post in participantPosts" :key="post.id" class="relative">
            <PostsCard :post="post" />
            <div class="mt-2 text-right">
              <UButton
                :to="`/article-builder?id=${post.id}`"
                color="primary"
                variant="soft"
                class="inline-flex items-center"
              >
                <Icon name="lucide:edit" class="w-5 h-5 mr-2" />
                {{ t('common.edit') }}
              </UButton>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '~/stores/user'
import { useArticleBuilderStore } from '~/stores/articleBuilder'
import { useDebounceFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

interface User {
  id: string
  email: string | null
  displayName: string | null
  avatar: string | null
  emailVerified: boolean
  disabled: boolean
  isAnonymous: boolean
  providerData: any[]
  customClaims: Record<string, any>
  createdAt: string
  lastLoginAt: string
  lastSignInTime: string
  metadata: {
    creationTime: string
    lastSignInTime: string
  }
  tenantId: string | null
  multiFactor: {
    enrolledFactors: any[]
  }
  contacts: {
    email: string | null
    phone: string | null
    telegram: string | null
    whatsapp: string | null
    viber: string | null
    discord: string | null
    linkedin: string | null
    github: string | null
    website: string | null
  }
}

interface Post {
  id: string
  title: string
  cover: string | null
  annotation: string
  owner: User
  ownerId: string
  authorId: string[]
  keywords: string[]
  domain: string
  content: string
  author: User[]
  viewedBy: string[]
  createdAt: string
  updatedAt: string
  status: 'draft' | 'published' | 'archived'
  views: number
  likes: number
  comments: number
  participants: number
  executionPolicy: 'contest' | 'public'
  currentParticipants: number
}

const { t } = useI18n()
const userStore = useUserStore()
const articleBuilderStore = useArticleBuilderStore()
const loading = ref(true)
const myPosts = ref<Post[]>([])
const participantPosts = ref<Post[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(9)
const sortBy = ref('createdAt')
const sortDirection = ref<'asc' | 'desc'>('desc')
const pagination = ref({
  total: 0,
  page: 1,
  limit: 9,
  pages: 1
})

const sortOptions = [
  { 
    label: t('common.sortByCreationDate'), 
    value: 'createdAt',
    icon: 'i-lucide-clock'
  },
  { 
    label: t('common.sortByViews'), 
    value: 'views',
    icon: 'i-lucide-eye'
  },
  { 
    label: t('common.sortByLikes'), 
    value: 'likes',
    icon: 'i-lucide-heart'
  },
  { 
    label: t('common.sortByComments'), 
    value: 'comments',
    icon: 'i-lucide-message-circle'
  }
]

// Load posts
const loadPosts = async () => {
  if (!userStore.user?.id) return
  
  try {
    loading.value = true
    
    // Load posts where user is owner or author
    const myPostsResponse = await $fetch<{
      posts: Post[]
      pagination: {
        total: number
        page: number
        limit: number
        pages: number
      }
    }>('/api/posts', {
      query: {
        ownerId: userStore.user.id,
        authorId: userStore.user.id,
        page: currentPage.value,
        limit: itemsPerPage.value,
        search: searchQuery.value,
        sortBy: sortBy.value,
        sortDirection: sortDirection.value
      }
    })
    console.log('My posts response:', myPostsResponse)
    myPosts.value = myPostsResponse.posts
    pagination.value = myPostsResponse.pagination

    // Load posts where user is participant
    const participantResponse = await $fetch<{
      posts: Post[]
      pagination: {
        total: number
        page: number
        limit: number
        pages: number
      }
    }>('/api/posts', {
      query: {
        participantId: userStore.user.id,
        page: currentPage.value,
        limit: itemsPerPage.value,
        search: searchQuery.value,
        sortBy: sortBy.value,
        sortDirection: sortDirection.value
      }
    })
    console.log('Participant posts response:', participantResponse)
    participantPosts.value = participantResponse.posts

    // Add check for empty array
    if (participantPosts.value.length === 0) {
      console.log('No participant posts found')
    }
  } catch (error) {
    console.error('Error loading posts:', error)
    useToast().add({
      title: t('common.error'),
      description: t('common.failedToLoadPosts'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Watch for parameter changes
watch([currentPage, sortBy, sortDirection], () => {
  loadPosts()
})

// Debounce search
const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1 // Reset page on search
  loadPosts()
}, 300)

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}

const handleSortChange = (value: string) => {
  sortBy.value = value
}

const getSortIcon = (value: string) => {
  return sortOptions.find(option => option.value === value)?.icon || 'i-lucide-clock'
}

const getSortLabel = (value: string) => {
  return sortOptions.find(option => option.value === value)?.label || t('common.sortByCreationDate')
}

// Load posts when component is mounted
onMounted(() => {
  if (userStore.isAuthenticated) {
    loadPosts()
  }
})

// Watch for authentication state changes
watch(() => userStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    loadPosts()
  } else {
    myPosts.value = []
    participantPosts.value = []
  }
})

// Add new function to handle new project creation
const handleNewProject = () => {
  articleBuilderStore.resetDraft()
  navigateTo('/article-builder')
}
</script>