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
                  
                  <!-- Subject Areas -->
                  <UFormField :label="$t('common.subjectAreas')" name="subjectAreas">
                    <div class="space-y-4">
                      <UButton
                        color="neutral"
                        variant="soft"
                        class="w-full flex items-center justify-between"
                        data-subject-area-button
                        @click="isSubjectAreaModalOpen = true"
                      >
                        <span>
                          {{ selectedSubjectAreas.length 
                            ? $t('common.selectedAreas', { count: selectedSubjectAreas.length })
                            : $t('common.selectSubjectAreas') 
                          }}
                        </span>
                        <UIcon name="i-lucide-chevron-right" class="w-5 h-5" />
                      </UButton>

                      <!-- Selected Areas Display -->
                      <div v-if="selectedSubjectAreas.length" class="flex flex-wrap gap-2">
                        <UBadge
                          v-for="area in selectedSubjectAreas"
                          :key="area.key"
                          color="primary"
                          variant="soft"
                          class="flex items-center gap-1"
                        >
                          <UIcon :name="area.icon" class="w-4 h-4" />
                          {{ area.label }}
                          <UIcon
                            name="i-lucide-x"
                            class="w-4 h-4 cursor-pointer"
                            @click="removeSubjectArea(area)"
                          />
                        </UBadge>
                      </div>
                    </div>
                  </UFormField>

                  <SubjectArea
                    v-model="isSubjectAreaModalOpen"
                    :selected-areas="selectedSubjectAreas"
                    @update:selected-areas="selectedSubjectAreas = $event"
                  />
                  
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
  import { useRoute, useRouter } from 'vue-router'
  import { z } from 'zod'
  import { CalendarDate, type DateValue, DateFormatter, getLocalTimeZone } from '@internationalized/date'
  import Avatar from '~/components/user/Avatar.vue'
  import UserCard from '~/components/user/Card.vue'
  import { useSearchFilterStore } from '~/stores/searchFilter'
  import SubjectArea from '~/components/common/subjectarea.vue'
  
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
  const isSubjectAreaModalOpen = ref(false)
  const showSubjectAreaModal = ref(false)
  const selectedSubjectAreas = ref<SubjectArea[]>([])

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
    authors: z.array(z.string()).optional(),
    subjectAreas: z.array(z.string()).optional()
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
    authors: searchFilterStore.selectedAuthors,
    subjectAreas: []
  })
  
  const selectedAuthors = ref<string[]>(searchFilterStore.selectedAuthors)
  const authors = ref<User[]>([])
  const pendingAuthors = ref(false)
  const errorAuthors = ref<Error | null>(null)

  const route = useRoute()
  const router = useRouter()

  // Add type definition for subject areas
  interface SubjectArea {
    key: string
    label: string
    icon?: string
  }

  // Initialize state from URL parameters
  const initStateFromQuery = () => {
    const query = route.query
    
    // If no URL parameters, reset all filters
    if (Object.keys(query).length === 0) {
      searchQuery.value = ''
      sortBy.value = 'createdAt'
      sortDirection.value = 'desc'
      currentPage.value = 1
      searchState.value = {
        title: '',
        domain: '',
        keywords: '',
        dateRange: undefined,
        authors: [],
        subjectAreas: []
      }
      selectedAuthors.value = []
      selectedSubjectAreas.value = []
      searchFilterStore.reset()
      return
    }
    
    // Initialize search query
    searchQuery.value = (query.search as string) || ''
    
    // Initialize sorting
    sortBy.value = (query.sortBy as string) || 'createdAt'
    sortDirection.value = (query.sortDirection as 'asc' | 'desc') || 'desc'
    
    // Initialize page
    currentPage.value = parseInt(query.page as string) || 1
    
    // Initialize advanced search
    const dateFrom = query.dateFrom ? new Date(query.dateFrom as string) : undefined
    const dateTo = query.dateTo ? new Date(query.dateTo as string) : undefined
    
    searchState.value = {
      title: (query.title as string) || '',
      domain: (query.domain as string) || '',
      keywords: (query.keywords as string) || '',
      dateRange: dateFrom ? {
        start: new CalendarDate(
          dateFrom.getFullYear(),
          dateFrom.getMonth() + 1,
          dateFrom.getDate()
        ),
        end: dateTo ? new CalendarDate(
          dateTo.getFullYear(),
          dateTo.getMonth() + 1,
          dateTo.getDate()
        ) : undefined
      } : undefined,
      authors: (query.authors as string)?.split(',') || [],
      subjectAreas: (query.subjectAreas as string)?.split(',') || []
    }
    
    // Initialize selected authors
    selectedAuthors.value = searchState.value.authors || []
    selectedSubjectAreas.value = []
  }

  // Update URL with current parameters
  const updateQueryParams = () => {
    const query: Record<string, string> = {}
    
    // Add parameters only if they differ from default values
    if (searchQuery.value) query.search = searchQuery.value
    if (sortBy.value !== 'createdAt') query.sortBy = sortBy.value
    if (sortDirection.value !== 'desc') query.sortDirection = sortDirection.value
    if (currentPage.value > 1) query.page = currentPage.value.toString()
    
    // Add advanced search parameters only if they exist
    if (searchState.value.title) query.title = searchState.value.title
    if (searchState.value.domain) query.domain = searchState.value.domain
    if (searchState.value.keywords) query.keywords = searchState.value.keywords
    
    // Handle dates
    if (searchState.value.dateRange?.start) {
      const date = searchState.value.dateRange.start as CalendarDate
      const dateObj = new Date(date.year, date.month - 1, date.day)
      query.dateFrom = dateObj.toISOString()
    }
    if (searchState.value.dateRange?.end) {
      const date = searchState.value.dateRange.end as CalendarDate
      const dateObj = new Date(date.year, date.month - 1, date.day)
      query.dateTo = dateObj.toISOString()
    }
    
    if (searchState.value.authors?.length) {
      query.authors = searchState.value.authors.join(',')
    }
    if (searchState.value.subjectAreas?.length) {
      query.subjectAreas = searchState.value.subjectAreas.join(',')
    }
    
    // Update URL without page reload
    router.replace({ query: Object.keys(query).length ? query : undefined })
  }

  // Load posts function
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
        authors: searchState.value.authors,
        subjectAreas: selectedSubjectAreas.value.map(area => area.key)
      }
      
      // Add dates from dateRange if they exist
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
      
      // Remove empty values
      Object.keys(query).forEach(key => {
        if (query[key] === '' || query[key] === null || query[key] === undefined || (Array.isArray(query[key]) && !query[key].length)) {
          delete query[key]
        }
      })

      // Save values to store
      searchFilterStore.setTitle(searchState.value.title || '')
      searchFilterStore.setDomain(searchState.value.domain || '')
      searchFilterStore.setKeywords(searchState.value.keywords || '')
      searchFilterStore.setSelectedAuthors(searchState.value.authors || [])

      console.log('Loading posts with query:', query)
      const response = await $fetch<{ posts: Post[], pagination: any }>('/api/posts/search', { query })
      console.log('Search response:', response)
      
      // Load author profiles for each post
      const postsWithAuthors = await Promise.all(response.posts.map(async (post) => {
        // Load owner profile
        const owner = post.ownerId ? await $fetch<User>(`/api/user/${post.ownerId}/profile`) : null
        
        // Load author profiles
        const authors = await Promise.all(
          (post.authorId || [])
            .filter(id => id !== post.ownerId) // Exclude owner from authors list
            .map(id => $fetch<User>(`/api/user/${id}/profile`))
        )

        // Create new post object with correct types
        const processedPost: Post = {
          ...post,
          owner: owner as User, // Cast to User type as we know owner cannot be null
          author: [owner, ...authors].filter(Boolean) as User[] // Filter null and cast to User[]
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

  // Watchers
  watch(() => route.query, (query) => {
    initStateFromQuery(query)
    loadPosts()
  }, { immediate: true })

  watch([searchQuery, sortBy, sortDirection, currentPage], () => {
    loadPosts()
  })

  watch(() => searchState.value, () => {
    loadPosts()
  }, { deep: true })

  // Load selected authors' profiles on mount and when selectedAuthors changes
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

  // Search authors
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

      // Add selected authors to search results if they're not there
      const selectedUsers = authors.value.filter((user: User) => selectedAuthors.value.includes(user.id))
      const newUsers = response.users.filter((user: User) => !selectedAuthors.value.includes(user.id))
      authors.value = [...selectedUsers, ...newUsers]
    } catch (e) {
      errorAuthors.value = e as Error
      console.error('Error searching authors:', e)
    } finally {
      pendingAuthors.value = false
    }
  }

  // Debounce author search
  const debouncedAuthorSearch = useDebounceFn(() => {
    searchAuthors()
  }, 300)
  
  // Reset advanced search
  const resetAdvancedSearch = () => {
    searchState.value = {
      title: '',
      domain: '',
      keywords: '',
      dateRange: {
        start: undefined,
        end: undefined
      },
      authors: [],
      subjectAreas: []
    }
    selectedAuthors.value = []
    authors.value = []
    selectedSubjectAreas.value = []
    searchQuery.value = ''
    searchFilterStore.reset()
  }
  
  // Handle advanced search
  const handleAdvancedSearch = () => {
    currentPage.value = 1
    loadPosts()
  }
  
  // Watch for parameter changes
  watch([sortBy, sortDirection], () => {
    currentPage.value = 1 // Reset to first page when sort changes
    loadPosts()
  })

  // Debounce search
  const debouncedSearch = useDebounceFn(() => {
    currentPage.value = 1 // Reset page on search
    loadPosts()
  }, 300)
  
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

  // Update removeSubjectArea function with proper type
  const removeSubjectArea = (area: SubjectArea) => {
    selectedSubjectAreas.value = selectedSubjectAreas.value.filter(a => a.key !== area.key)
    searchState.value.subjectAreas = selectedSubjectAreas.value.map(a => a.key)
  }
  </script>