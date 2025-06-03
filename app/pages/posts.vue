<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Заголовок -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Мои посты</h1>
      
      <!-- Поиск -->
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

    <!-- Посты где пользователь владелец -->
    <div class="mb-12">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Мои проекты
      </h2>

      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin" />
      </div>

      <div v-else-if="ownedPosts.length === 0" class="text-center py-12">
        <div class="text-gray-500 dark:text-gray-400">
          <Icon name="lucide:file-question" class="w-12 h-12 mx-auto mb-4" />
          <p>У вас пока нет проектов</p>
          <UButton
            color="primary"
            variant="soft"
            class="mt-4"
            @click="handleNewProject"
          >
            Создать первый проект
          </UButton>
        </div>
      </div>

      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="post in ownedPosts" :key="post.id" class="relative">
            <PostsCard :post="post" />
            <div class="mt-2 text-right">
              <UButton
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

    <!-- Посты где пользователь автор -->
    <div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Проекты где я участвую
      </h2>

      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin" />
      </div>

      <div v-else-if="authoredPosts.length === 0" class="text-center py-12">
        <div class="text-gray-500 dark:text-gray-400">
          <Icon name="lucide:users" class="w-12 h-12 mx-auto mb-4" />
          <p>Вы пока не участвуете в проектах</p>
        </div>
      </div>

      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="post in authoredPosts" :key="post.id" class="relative">
            <PostsCard :post="post" />
            <div class="mt-2 text-right">
              <UButton
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
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import { useArticleBuilderStore } from '~/stores/articleBuilder'
import { useDebounceFn } from '@vueuse/core'

const userStore = useUserStore()
const articleBuilderStore = useArticleBuilderStore()
const loading = ref(true)
const ownedPosts = ref<Post[]>([])
const authoredPosts = ref<Post[]>([])
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
    label: 'По дате создания', 
    value: 'createdAt',
    icon: 'i-lucide-clock'
  },
  { 
    label: 'По просмотрам', 
    value: 'views',
    icon: 'i-lucide-eye'
  },
  { 
    label: 'По лайкам', 
    value: 'likes',
    icon: 'i-lucide-heart'
  },
  { 
    label: 'По комментариям', 
    value: 'comments',
    icon: 'i-lucide-message-circle'
  }
]

// Загрузка постов
const loadPosts = async () => {
  if (!userStore.user?.id) return
  
  try {
    loading.value = true
    
    // Загрузка постов где пользователь владелец
    const ownedResponse = await $fetch('/api/posts', {
      query: {
        ownerId: userStore.user.id,
        page: currentPage.value,
        limit: itemsPerPage.value,
        search: searchQuery.value,
        sortBy: sortBy.value,
        sortDirection: sortDirection.value
      }
    })
    ownedPosts.value = ownedResponse.posts
    pagination.value = ownedResponse.pagination

    // Загрузка постов где пользователь автор
    const authoredResponse = await $fetch('/api/posts', {
      query: {
        authorId: userStore.user.id,
        page: currentPage.value,
        limit: itemsPerPage.value,
        search: searchQuery.value,
        sortBy: sortBy.value,
        sortDirection: sortDirection.value
      }
    })
    // Фильтруем посты где пользователь не владелец
    authoredPosts.value = authoredResponse.posts.filter(
      post => post.ownerId !== userStore.user?.id
    )
  } catch (error) {
    console.error('Error loading posts:', error)
    useToast().add({
      title: 'Ошибка',
      description: 'Не удалось загрузить посты',
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
  currentPage.value = 1 // Сбрасываем страницу при поиске
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

// Загружаем посты при монтировании компонента
onMounted(() => {
  if (userStore.isAuthenticated) {
    loadPosts()
  }
})

// Следим за изменением состояния аутентификации
watch(() => userStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    loadPosts()
  } else {
    ownedPosts.value = []
    authoredPosts.value = []
  }
})

// Add new function to handle new project creation
const handleNewProject = () => {
  articleBuilderStore.resetDraft()
  navigateTo('/article-builder')
}
</script>