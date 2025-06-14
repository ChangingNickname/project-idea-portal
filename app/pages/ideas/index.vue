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
          
          <!-- Advanced Search -->
          <div class="mt-4">
            <UButton
              color="neutral"
              variant="ghost"
              class="w-full flex items-center justify-between"
              @click="isAdvancedSearchOpen = !isAdvancedSearchOpen"
            >
              <span>{{ $t('common.advancedSearch') }}</span>
              <UIcon
                :name="isAdvancedSearchOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="w-5 h-5"
              />
            </UButton>
            
            <div v-if="isAdvancedSearchOpen" class="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <UForm :schema="searchSchema" :state="searchState" class="space-y-6" @submit="handleAdvancedSearch">
                <div class="flex flex-col gap-6">
                  <!-- Title -->
                  <UFormField :label="$t('post.create.title')" name="title">
                    <UInput v-model="searchState.title" :placeholder="$t('post.create.titlePlaceholder')" class="w-full" />
                  </UFormField>
                  
                  <!-- Domain -->
                  <UFormField :label="$t('post.create.domain')" name="domain">
                    <UInput v-model="searchState.domain" :placeholder="$t('post.create.domainPlaceholder')" class="w-full" />
                  </UFormField>
                  
                  <!-- Keywords -->
                  <UFormField :label="$t('post.create.keywords')" name="keywords">
                    <UInput v-model="searchState.keywords" :placeholder="$t('post.create.keywordsPlaceholder')" class="w-full" />
                  </UFormField>
                  
                  <!-- Authors -->
                  <UFormField :label="$t('post.authors')" name="authors">
                    <div class="space-y-4">
                      <UInput
                        v-model="searchQuery"
                        :placeholder="$t('common.searchUsers')"
                        icon="i-lucide-search"
                        class="w-full"
                        :loading="pendingAuthors"
                        @input="debouncedAuthorSearch"
                      />
                      
                      <div v-if="pendingAuthors" class="flex justify-center py-4">
                        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-primary animate-spin" />
                      </div>

                      <div v-else-if="errorAuthors" class="text-center text-red-500 py-2">
                        {{ $t('common.error') }}
                      </div>

                      <div v-else-if="authors.length" class="space-y-2">
                        <div
                          v-for="user in authors"
                          :key="user.id"
                          class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <UCheckbox
                            :model-value="selectedAuthors.includes(user.id)"
                            @update:model-value="(value: boolean) => {
                              if (value) {
                                selectedAuthors.push(user.id)
                                searchState.authors = [...selectedAuthors]
                                searchFilterStore.addAuthor(user.id)
                              } else {
                                selectedAuthors = selectedAuthors.filter((id: string) => id !== user.id)
                                searchState.authors = [...selectedAuthors]
                                searchFilterStore.removeAuthor(user.id)
                              }
                            }"
                            :label="user.displayName || user.email || $t('common.anonymousUser')"
                            class="flex-1"
                          />
                          <Avatar
                            :src="user.avatar || undefined"
                            :email="user.email || undefined"
                            :alt="user.displayName || $t('common.userAvatar')"
                            :isActive="user.emailVerified"
                            size="sm"
                          />
                        </div>
                      </div>

                      <!-- Выбранные авторы -->
                      <div v-if="selectedAuthors.length" class="space-y-2">
                        <div
                          v-for="userId in selectedAuthors"
                          :key="userId"
                          class="relative group"
                        >
                          <UserCard
                            :user="authors.find((u: User) => u.id === userId) || null"
                            class="w-full"
                          />
                          <UButton
                            color="error"
                            variant="soft"
                            size="xs"
                            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            @click="() => {
                              selectedAuthors = selectedAuthors.filter((id: string) => id !== userId)
                              searchState.authors = [...selectedAuthors]
                              searchFilterStore.removeAuthor(userId)
                            }"
                          >
                            <UIcon name="i-lucide-x" class="w-4 h-4" />
                          </UButton>
                        </div>
                      </div>
                    </div>
                  </UFormField>
                  
                  <!-- Date Range -->
                  <UFormField :label="$t('common.dateRange')" name="dateRange">
                    <UPopover>
                      <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-between">
                        <template v-if="searchState.dateRange?.start">
                          <template v-if="searchState.dateRange?.end">
                            {{ df.format(searchState.dateRange.start.toDate(getLocalTimeZone())) }} - {{ df.format(searchState.dateRange.end.toDate(getLocalTimeZone())) }}
                          </template>
                          <template v-else>
                            {{ df.format(searchState.dateRange.start.toDate(getLocalTimeZone())) }}
                          </template>
                        </template>
                        <template v-else>
                          {{ $t('common.selectDate') }}
                        </template>
                      </UButton>

                      <template #content>
                        <UCalendar 
                          v-model="searchState.dateRange" 
                          class="p-2" 
                          :number-of-months="2" 
                          range 
                        />
                      </template>
                    </UPopover>
                  </UFormField>
                </div>
                
                <div class="flex justify-end gap-2">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    @click="resetAdvancedSearch"
                  >
                    {{ $t('common.reset') }}
                  </UButton>
                  <UButton
                    type="submit"
                    color="primary"
                  >
                    {{ $t('common.search') }}
                  </UButton>
                </div>
              </UForm>
            </div>
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
            {{ $t('common.createProject') }}
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
          <p class="text-gray-500 dark:text-gray-400">{{ $t('common.noArticlesFound') }}</p>
          <UButton
            color="primary"
            variant="soft"
            class="mt-4"
            @click="handleNewProject"
          >
            {{ $t('common.createFirstArticle') }}
          </UButton>
        </div>
      </div>
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-2 md:px-4 lg:px-6">
          <div v-for="post in posts" :key="post.id" class="flex flex-col h-full">
            <PostsCard :post="post" />
            <div class="mt-2 flex justify-end">
              <UButton
                v-if="post.status === 'draft' && post.ownerId === userStore.user?.id"
                :to="`/article-builder?id=${post.id}`"
                color="primary"
                variant="soft"
                class="inline-flex items-center"
              >
                <Icon name="lucide:edit" class="w-5 h-5 mr-2" />
                {{ $t('common.edit') }}
              </UButton>
            </div>
          </div>
        </div>
        <!-- Пагинация -->
        <div v-if="pagination.pages > 1" class="flex justify-center mt-6">
          <UPagination
            v-model:page="currentPage"
            :total="pagination.total"
            :page-count="pagination.pages"
            :items-per-page="itemsPerPage"
            @update:page="handlePageChange"
          />
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
  import { z } from 'zod'
  import { CalendarDate, type DateValue, DateFormatter, getLocalTimeZone } from '@internationalized/date'
  import Avatar from '~/components/user/Avatar.vue'
  import UserCard from '~/components/user/Card.vue'
  import { useSearchFilterStore } from '~/stores/searchFilter'
  
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
    { label: t('common.sortByLikes'), value: 'likes', icon: 'i-lucide-heart' }
  ]
  
  const userStore = useUserStore()
  
  const isAdvancedSearchOpen = ref(false)

  const df = new DateFormatter('ru-RU', {
    dateStyle: 'medium'
  })

  const searchFilterStore = useSearchFilterStore()

  const searchSchema = z.object({
    title: z.string().optional(),
    domain: z.string().optional(),
    keywords: z.string().optional(),
    dateRange: z.object({
      start: z.custom<DateValue>().optional(),
      end: z.custom<DateValue>().optional()
    }).optional(),
    authors: z.array(z.string()).optional()
  })

  type SearchState = z.infer<typeof searchSchema>

  const searchState = ref<SearchState>({
    title: searchFilterStore.title,
    domain: searchFilterStore.domain,
    keywords: searchFilterStore.keywords,
    dateRange: {
      start: searchFilterStore.dateRange.start ? new CalendarDate(
        searchFilterStore.dateRange.start.getFullYear(),
        searchFilterStore.dateRange.start.getMonth() + 1,
        searchFilterStore.dateRange.start.getDate()
      ) : undefined,
      end: searchFilterStore.dateRange.end ? new CalendarDate(
        searchFilterStore.dateRange.end.getFullYear(),
        searchFilterStore.dateRange.end.getMonth() + 1,
        searchFilterStore.dateRange.end.getDate()
      ) : undefined
    },
    authors: searchFilterStore.selectedAuthors
  })
  
  const selectedAuthors = ref<string[]>(searchFilterStore.selectedAuthors)
  const authors = ref<User[]>([])
  const pendingAuthors = ref(false)
  const errorAuthors = ref<Error | null>(null)

  // Загружаем профили выбранных авторов при монтировании и при изменении selectedAuthors
  watch(selectedAuthors, async (newAuthors: string[]) => {
    if (newAuthors.length) {
      const authorsData = await Promise.all(
        newAuthors.map((id: string) => $fetch<User>(`/api/user/${id}/profile`))
      )
      authors.value = authorsData
    } else {
      authors.value = []
    }
  }, { immediate: true })

  // Поиск авторов
  const searchAuthors = async () => {
    if (!searchQuery.value) {
      authors.value = selectedAuthors.value.length ? authors.value : []
      return
    }

    pendingAuthors.value = true
    errorAuthors.value = null

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

      // Добавляем выбранных авторов в результаты поиска, если их там нет
      const selectedUsers = authors.value.filter((user: User) => selectedAuthors.value.includes(user.id))
      const newUsers = response.users.filter((user: User) => !selectedAuthors.value.includes(user.id))
      authors.value = [...selectedUsers, ...newUsers]
    } catch (e) {
      errorAuthors.value = e as Error
      console.error('Ошибка поиска авторов:', e)
    } finally {
      pendingAuthors.value = false
    }
  }

  // Дебаунс поиска авторов
  const debouncedAuthorSearch = useDebounceFn(() => {
    searchAuthors()
  }, 300)
  
  const resetAdvancedSearch = () => {
    searchState.value = {
      title: '',
      domain: '',
      keywords: '',
      dateRange: {
        start: undefined,
        end: undefined
      },
      authors: []
    }
    selectedAuthors.value = []
    authors.value = []
    searchQuery.value = ''
    searchFilterStore.reset()
  }
  
  const handleAdvancedSearch = () => {
    currentPage.value = 1
    loadPosts()
  }
  
  // Загрузка статей
  const loadPosts = async () => {
    try {
      loading.value = true
      const query: any = {
        page: currentPage.value,
        limit: itemsPerPage.value,
        search: searchQuery.value,
        sortBy: sortBy.value,
        sortDirection: sortDirection.value,
        title: searchState.value.title,
        domain: searchState.value.domain,
        keywords: searchState.value.keywords,
        authors: searchState.value.authors
      }
      
      // Добавляем даты из dateRange если они есть
      if (searchState.value.dateRange?.start) {
        const date = searchState.value.dateRange.start as CalendarDate
        query.dateFrom = new Date(date.year, date.month - 1, date.day).toISOString()
        searchFilterStore.setDateRange(
          new Date(date.year, date.month - 1, date.day),
          searchState.value.dateRange.end ? new Date(
            (searchState.value.dateRange.end as CalendarDate).year,
            (searchState.value.dateRange.end as CalendarDate).month - 1,
            (searchState.value.dateRange.end as CalendarDate).day
          ) : null
        )
      }
      if (searchState.value.dateRange?.end) {
        const date = searchState.value.dateRange.end as CalendarDate
        query.dateTo = new Date(date.year, date.month - 1, date.day).toISOString()
      }
      
      // Удаляем пустые значения
      Object.keys(query).forEach(key => {
        if (query[key] === '' || query[key] === null || query[key] === undefined || (Array.isArray(query[key]) && !query[key].length)) {
          delete query[key]
        }
      })

      // Сохраняем значения в store
      searchFilterStore.setTitle(searchState.value.title || '')
      searchFilterStore.setDomain(searchState.value.domain || '')
      searchFilterStore.setKeywords(searchState.value.keywords || '')
      searchFilterStore.setSelectedAuthors(searchState.value.authors || [])

      console.log('Loading posts with query:', query)
      const response = await $fetch<{ posts: Post[], pagination: any }>('/api/posts/search', { query })
      console.log('Search response:', response)
      
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
      pagination.value = {
        ...response.pagination,
        page: currentPage.value
      }
      console.log('Updated pagination:', pagination.value)
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
  watch([sortBy, sortDirection], () => {
    currentPage.value = 1 // Reset to first page when sort changes
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
  
  // Add responsive items per page
  const updateItemsPerPage = () => {
    itemsPerPage.value = window.innerWidth >= 768 ? 10 : 9
  }

  // Update items per page on mount and resize
  onMounted(() => {
    updateItemsPerPage()
    window.addEventListener('resize', updateItemsPerPage)
    loadPosts()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateItemsPerPage)
  })

  // Add new function to handle new project creation
  const articleBuilderStore = useArticleBuilderStore()
  const handleNewProject = () => {
    articleBuilderStore.resetDraft()
    navigateTo('/article-builder')
  }

  // Restore handlePageChange function
  const handlePageChange = async (page: number) => {
    currentPage.value = page
    await loadPosts()
  }
  </script>