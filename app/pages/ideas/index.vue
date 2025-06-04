<template>
    <div class="container mx-auto px-4 py-8">
      <!-- Заголовок и поиск -->
      <div class="flex flex-col gap-6 mb-8">
        <!-- Search Section -->
        <div class="w-full">
          <div class="relative flex items-center">
            <UInput
              v-model="searchQuery"
              :placeholder="$t('common.search')"
              icon="i-heroicons-magnifying-glass"
              size="xl"
              class="w-full"
              @keyup.enter="handleSearch"
            />
            <UButton
              color="primary"
              size="xl"
              class="absolute right-0 top-1/2 -translate-y-1/2"
              @click="handleSearch"
            >
              {{ $t('common.search') }}
            </UButton>
          </div>
        </div>

        <!-- Фильтры и сортировка -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
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
          <UButton
            color="primary"
            variant="soft"
            @click="handleNewProject"
          >
            <Icon name="lucide:plus" class="w-5 h-5 mr-2" />
            {{ t('common.createProject') }}
          </UButton>
        </div>
      </div>
  
      <!-- Список статей -->
      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin" />
      </div>
      <div v-else-if="posts.length === 0" class="flex flex-col items-center justify-center py-12">
        <div class="text-center">
          <Icon name="lucide:file-question" class="w-12 h-12 mx-auto mb-4" />
          <p class="text-gray-500 dark:text-gray-400">{{ t('common.noArticlesFound') }}</p>
          <UButton
            color="primary"
            variant="soft"
            class="mt-4"
            @click="handleNewProject"
          >
            {{ t('common.createFirstArticle') }}
          </UButton>
        </div>
      </div>
      <div v-else class="flex flex-col gap-6">
        <div class="flex flex-wrap gap-8">
          <div v-for="post in posts" :key="post.id" class="flex flex-col w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.33rem)]">
            <PostsCard :post="post" />
            <div class="m-2 flex justify-end">
              <UButton
                v-if="post.status === 'draft' && post.ownerId === userStore.user?.id"
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
        <!-- Пагинация -->
        <div class="flex justify-center ">
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
  import { useArticleBuilderStore } from '~/stores/articleBuilder'
  import { useDebounceFn } from '@vueuse/core'
  import { useUserStore } from '~/stores/user'
  import { useI18n } from 'vue-i18n'
  import { useRoute } from 'vue-router'
  
  const { t } = useI18n()
  const loading = ref(true)
  const posts = ref<Post[]>([])
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
    { label: t('common.sortByCreationDate'), value: 'createdAt', icon: 'i-lucide-clock' },
    { label: t('common.sortByViews'), value: 'views', icon: 'i-lucide-eye' },
    { label: t('common.sortByLikes'), value: 'likes', icon: 'i-lucide-heart' },
    { label: t('common.sortByComments'), value: 'comments', icon: 'i-lucide-message-circle' }
  ]
  
  const userStore = useUserStore()
  
  // Загрузка статей
  const loadPosts = async () => {
    try {
      loading.value = true
      const query: any = {
        page: currentPage.value,
        limit: itemsPerPage.value,
        search: searchQuery.value,
        sortBy: sortBy.value,
        sortDirection: sortDirection.value
      }
      if (userStore.user) {
        query.ownerId = userStore.user.id
      }

      // Всегда используем эндпоинт поиска
      const response = await $fetch<{ posts: Post[], pagination: any }>('/api/posts/search', { query })
      console.log('Posts response:', response.posts)
      
      // Загружаем профили авторов для каждого поста
      const postsWithAuthors = await Promise.all(response.posts.map(async (post) => {
        // Загружаем профиль владельца
        const owner = post.ownerId ? await $fetch<User>(`/api/user/${post.ownerId}/profile`) : null
        
        // Загружаем профили авторов
        const authors = await Promise.all(
          (post.authorId || [])
            .filter(id => id !== post.ownerId) // Исключаем владельца из списка авторов
            .map(id => $fetch<User>(`/api/user/${id}/profile`))
        )

        // Создаем новый объект поста с правильными типами
        const processedPost: Post = {
          ...post,
          owner: owner as User, // Приводим к типу User, так как мы знаем, что owner не может быть null
          author: [owner, ...authors].filter(Boolean) as User[] // Фильтруем null и приводим к типу User[]
        }

        return processedPost
      }))
      
      console.log('Processed posts with authors:', postsWithAuthors)
      posts.value = postsWithAuthors
      pagination.value = response.pagination
    } catch (error) {
      console.error('Error loading posts:', error)
      useToast().add({
        title: t('common.error'),
        description: t('common.failedToLoadArticles'),
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }
  
  // Следим за изменениями параметров
  watch([currentPage, sortBy, sortDirection], () => {
    loadPosts()
  })
  
  // Дебаунс поиска
  const debouncedSearch = useDebounceFn(() => {
    currentPage.value = 1 // Сброс страницы при поиске
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
  
  // Добавляем функцию handleSearch
  const handleSearch = () => {
    currentPage.value = 1 // Сброс страницы при поиске
    loadPosts()
  }
  
  // Загружаем статьи при монтировании
  onMounted(() => {
    loadPosts()
  })
  
  // Add new function to handle new project creation
  const articleBuilderStore = useArticleBuilderStore()
  const handleNewProject = () => {
    articleBuilderStore.resetDraft()
    navigateTo('/article-builder')
  }
  </script>