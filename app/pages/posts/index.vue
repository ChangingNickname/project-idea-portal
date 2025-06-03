<template>
    <div class="container mx-auto px-4 py-8">
      <!-- Заголовок и поиск -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Статьи</h1>
        <UInput
          v-model="searchQuery"
          placeholder="Поиск по названию или ID..."
          icon="i-lucide-search"
          class="w-64"
          :loading="loading"
          @input="debouncedSearch"
        />
      </div>
  
      <!-- Фильтры и сортировка -->
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
          Создать проект
        </UButton>
      </div>
  
      <!-- Список статей -->
      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin" />
      </div>
      <div v-else-if="posts.length === 0" class="text-center py-12">
        <div class="text-gray-500 dark:text-gray-400">
          <Icon name="lucide:file-question" class="w-12 h-12 mx-auto mb-4" />
          <p>Нет статей по вашему запросу</p>
          <UButton
            color="primary"
            variant="soft"
            class="mt-4"
            @click="handleNewProject"
          >
            Создать первую статью
          </UButton>
        </div>
      </div>
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="post in posts" :key="post.id" class="relative">
            <PostsCard :post="post" />
            <div class="mt-2 text-right">
              <UButton
                v-if="post.status === 'draft' && post.ownerId === userStore.user?.id"
                :to="`/article-builder?id=${post.id}`"
                color="primary"
                variant="soft"
                class="inline-flex items-center"
              >
                <Icon name="lucide:edit" class="w-5 h-5 mr-2" />
                Редактировать
              </UButton>
            </div>
          </div>
        </div>
        <!-- Пагинация -->
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
  import { useArticleBuilderStore } from '~/stores/articleBuilder'
  import { useDebounceFn } from '@vueuse/core'
  import { useUserStore } from '~/stores/user'
  
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
    { label: 'По дате создания', value: 'createdAt', icon: 'i-lucide-clock' },
    { label: 'По просмотрам', value: 'views', icon: 'i-lucide-eye' },
    { label: 'По лайкам', value: 'likes', icon: 'i-lucide-heart' },
    { label: 'По комментариям', value: 'comments', icon: 'i-lucide-message-circle' }
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
      const response = await $fetch('/api/posts', { query })
      posts.value = Array.isArray(response.posts)
        ? response.posts.map((post: any) => ({
            ...post,
            author: Array.isArray(post.author) ? post.author.filter(Boolean) : []
          }))
        : []
      pagination.value = response.pagination
    } catch (error) {
      console.error('Error loading posts:', error)
      useToast().add({
        title: 'Ошибка',
        description: 'Не удалось загрузить статьи',
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
    return sortOptions.find(option => option.value === value)?.label || 'По дате создания'
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