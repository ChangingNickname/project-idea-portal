<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Панель управления -->
    <div class="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="container mx-auto px-4 py-4">
        <!-- Верхняя панель -->
        <div class="flex items-center justify-between mb-4">
          <!-- Левая сторона - управление окнами -->
          <div class="flex items-center gap-4">
            <UButton
              :color="store.showCreate ? 'primary' : 'neutral'"
              variant="soft"
              :disabled="!canEditPost"
              :class="{ 'opacity-50 cursor-not-allowed': !canEditPost }"
              @click="store.toggleCreate"
            >
              <Icon name="lucide:edit" class="w-5 h-5 mr-2" />
              Создание
            </UButton>
            <UButton
              :color="store.showPreview ? 'primary' : 'neutral'"
              variant="soft"
              @click="store.togglePreview"
            >
              <Icon name="lucide:eye" class="w-5 h-5 mr-2" />
              Превью
            </UButton>
          </div>

          <!-- Правая сторона - кнопки действий -->
          <div class="flex items-center gap-8">
            <!-- Кнопки изменения статуса (только для владельца) -->
            <template v-if="canChangeStatus">
              <UButton
                v-if="store.draft.id && store.draft.status === 'archived'"
                color="success"
                variant="soft"
                @click="handleRestore"
              >
                <Icon name="lucide:archive-restore" class="w-5 h-5 mr-2" />
                Восстановить
              </UButton>
              <UButton
                v-else-if="store.draft.id && store.draft.status !== 'archived'"
                color="error"
                variant="soft"
                @click="handleArchive"
              >
                <Icon name="lucide:archive" class="w-5 h-5 mr-2" />
                Архивировать
              </UButton>
              <UButton
                v-if="store.draft.id && store.draft.status === 'draft'"
                color="success"
                variant="soft"
                @click="handlePublish"
              >
                <Icon name="lucide:send" class="w-5 h-5 mr-2" />
                Опубликовать
              </UButton>
              <UButton
                v-else-if="store.draft.id && store.draft.status === 'published'"
                color="warning"
                variant="soft"
                @click="handleUnpublish"
              >
                <Icon name="lucide:archive" class="w-5 h-5 mr-2" />
                В черновики
              </UButton>
            </template>

            <!-- Кнопка сохранения (доступна всем, кто может редактировать) -->
            <UButton
              v-if="canEditPost"
              :color="store.draft.id ? 'primary' : 'success'"
              variant="soft"
              @click="handleSave"
            >
              <Icon name="lucide:save" class="w-5 h-5 mr-2" />
              {{ store.draft.id ? 'Обновить' : 'Сохранить' }}
            </UButton>
          </div>
        </div>

        <!-- Нижняя панель - ID поста -->
        <div v-if="store.draft.id" class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Icon name="lucide:hash" class="w-4 h-4" />
          <span>ID: {{ store.draft.id }}</span>
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            @click="copyId"
          >
            <Icon name="lucide:copy" class="w-4 h-4" />
          </UButton>
        </div>
      </div>
    </div>

    <!-- Основной контент -->
    <div class="container mx-auto px-4 py-8">
      <div v-if="isLoading" class="flex justify-center items-center min-h-[50vh]">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin" />
      </div>
      <div v-else class="grid gap-6" :class="gridClass">
        <!-- Левая панель -->
        <div v-if="store.leftPanel" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-medium">
              {{ store.leftPanel === 'create' ? 'Создание' : 'Превью' }}
            </h2>
          </div>
          <div class="p-4" :class="{ 'opacity-50 pointer-events-none': !canEditPost && store.leftPanel === 'create' }">
            <PostsCreate 
              v-if="store.leftPanel === 'create'" 
              :model-value="store.draft"
              :disabled="!canEditPost"
              @update="handleFormUpdate"
            />
            <PostsFull v-else :post="store.draft" :key="previewKey" />
          </div>
        </div>

        <!-- Правая панель -->
        <div v-if="store.rightPanel" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-medium">
              {{ store.rightPanel === 'create' ? 'Создание' : 'Превью' }}
            </h2>
          </div>
          <div class="p-4" :class="{ 'opacity-50 pointer-events-none': !canEditPost && store.rightPanel === 'create' }">
            <PostsCreate 
              v-if="store.rightPanel === 'create'" 
              :model-value="store.draft"
              :disabled="!canEditPost"
              @update="handleFormUpdate"
            />
            <PostsFull v-else :post="store.draft" :key="previewKey" />
          </div>
        </div>
      </div>
    </div>
    <PostsAiagent />
  </div>
</template>

<script setup lang="ts">
import { useArticleBuilderStore } from '~/stores/articleBuilder'
import PostsCreate from '~/components/posts/create.vue'
import PostsFull from '~/components/posts/full.vue'
import { useUserStore } from '~/stores/user'
import { useRoute } from 'vue-router'

const store = useArticleBuilderStore()
const userStore = useUserStore()
const route = useRoute()
const previewKey = ref(0)
const isLoading = ref(false)

// Функция проверки прав на редактирование
const canEditPost = computed(() => {
  if (!userStore.user || !store.draft.id) return true // Новый пост можно редактировать
  return store.draft.status === 'draft' && (
    store.draft.ownerId === userStore.user.id || 
    store.draft.authorId?.includes(userStore.user.id)
  )
})

// Функция проверки прав на изменение статуса
const canChangeStatus = computed(() => {
  if (!userStore.user || !store.draft.id) return true // Новый пост можно публиковать
  return store.draft.ownerId === userStore.user.id
})

// Load post for editing if ID is provided
const loadPost = async (id: string) => {
  try {
    isLoading.value = true
    const response = await $fetch<Post>(`/api/posts/${id}`)
    if (response) {
      // Ensure all required fields are present
      const postData: Partial<Post> = {
        id: response.id,
        title: response.title || '',
        cover: response.cover || null,
        annotation: response.annotation || '',
        keywords: response.keywords || [],
        domain: response.domain || '',
        content: response.content || '',
        status: response.status || 'draft',
        executionPolicy: response.executionPolicy || 'public',
        participants: response.participants || [],
        currentParticipants: response.currentParticipants || 0,
        views: response.views || 0,
        likes: response.likes || 0,
        comments: response.comments || 0,
        owner: response.owner,
        ownerId: response.ownerId,
        author: response.author || [],
        authorId: response.authorId || [],
        maxParticipants: response.maxParticipants,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      }
      store.updateDraft(postData)
      previewKey.value++
    }
  } catch (error) {
    console.error('Error loading post:', error)
    useToast().add({
      title: 'Ошибка',
      description: 'Не удалось загрузить пост',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

// Set author when component is mounted and load post if needed
onMounted(async () => {
  if (userStore.isAuthenticated && userStore.user) {
    // Load post if ID is provided in route
    const postId = route.query.id as string
    if (postId) {
      await loadPost(postId)
    } else if (!store.draft.owner) {
      // Only set default owner if we're creating a new post
      store.updateDraft({ 
        owner: userStore.user,
        ownerId: userStore.user.id,
        author: [userStore.user],
        authorId: [userStore.user.id]
      })
    }
  }
})

// Вычисляем классы для сетки в зависимости от количества панелей
const gridClass = computed(() => {
  if (store.showCreate && store.showPreview) {
    return 'grid-cols-2'
  }
  return 'grid-cols-1'
})

// Обработчик обновления формы
const handleFormUpdate = (newForm: Partial<Post>) => {
  store.updateDraft(newForm)
  previewKey.value++
}

// Handle save/update
const handleSave = async () => {
  try {
    const response = await $fetch<Post>(`/api/posts${store.draft.id ? `/${store.draft.id}` : ''}`, {
      method: store.draft.id ? 'put' : 'post',
      body: store.draft
    })
    
    if (response) {
      store.updateDraft(response)
      // Show success notification
      useToast().add({
        title: 'Успех',
        description: store.draft.id ? 'Пост обновлен' : 'Пост создан',
        color: 'success'
      })
    }
  } catch (error) {
    // Show error notification
    useToast().add({
      title: 'Ошибка',
      description: 'Не удалось сохранить пост',
      color: 'error'
    })
  }
}

// Copy ID to clipboard
const copyId = async () => {
  if (!store.draft.id) return
  
  try {
    await navigator.clipboard.writeText(store.draft.id)
    useToast().add({
      title: 'ID скопирован',
      description: 'ID поста скопирован в буфер обмена',
      color: 'success'
    })
  } catch (error) {
    useToast().add({
      title: 'Ошибка',
      description: 'Не удалось скопировать ID',
      color: 'error'
    })
  }
}

// Handle publish
const handlePublish = async () => {
  if (!store.draft.id) return
  
  try {
    const response = await $fetch<Post>(`/api/posts/${store.draft.id}`, {
      method: 'put',
      body: {
        ...store.draft,
        status: 'published'
      }
    })
    
    if (response) {
      store.updateDraft(response)
      // Show success notification
      useToast().add({
        title: 'Успех',
        description: 'Пост опубликован',
        color: 'success'
      })
    }
  } catch (error) {
    // Show error notification
    useToast().add({
      title: 'Ошибка',
      description: 'Не удалось опубликовать пост',
      color: 'error'
    })
  }
}

// Handle unpublish
const handleUnpublish = async () => {
  if (!store.draft.id) return
  
  try {
    const response = await $fetch<Post>(`/api/posts/${store.draft.id}`, {
      method: 'put',
      body: {
        ...store.draft,
        status: 'draft'
      }
    })
    
    if (response) {
      store.updateDraft(response)
      // Show success notification
      useToast().add({
        title: 'Успех',
        description: 'Пост перемещен в черновики',
        color: 'success'
      })
    }
  } catch (error) {
    // Show error notification
    useToast().add({
      title: 'Ошибка',
      description: 'Не удалось переместить пост в черновики',
      color: 'error'
    })
  }
}

// Handle archive
const handleArchive = async () => {
  if (!store.draft.id) return
  
  try {
    const response = await $fetch<Post>(`/api/posts/${store.draft.id}`, {
      method: 'put',
      body: {
        ...store.draft,
        status: 'archived'
      }
    })
    
    if (response) {
      store.updateDraft(response)
      // Show success notification
      useToast().add({
        title: 'Успех',
        description: 'Пост архивирован',
        color: 'success'
      })
    }
  } catch (error) {
    // Show error notification
    useToast().add({
      title: 'Ошибка',
      description: 'Не удалось архивировать пост',
      color: 'error'
    })
  }
}

// Handle restore
const handleRestore = async () => {
  if (!store.draft.id) return
  
  try {
    const response = await $fetch<Post>(`/api/posts/${store.draft.id}`, {
      method: 'put',
      body: {
        ...store.draft,
        status: 'draft'
      }
    })
    
    if (response) {
      store.updateDraft(response)
      // Show success notification
      useToast().add({
        title: 'Успех',
        description: 'Пост восстановлен',
        color: 'success'
      })
    }
  } catch (error) {
    // Show error notification
    useToast().add({
      title: 'Ошибка',
      description: 'Не удалось восстановить пост',
      color: 'error'
    })
  }
}
</script>