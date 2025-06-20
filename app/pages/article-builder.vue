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
              @click="store.toggleCreate"
            >
              <Icon name="lucide:edit" class="w-5 h-5 mr-2" />
              {{ t('common.create') }}
            </UButton>
            <UButton
              :color="store.showAiAgent ? 'primary' : 'neutral'"
              variant="soft"
              @click="store.toggleAiAgent"
            >
              <Icon name="lucide:bot" class="w-5 h-5 mr-2" />
              {{ t('common.aiAssistant') }}
            </UButton>
            <UButton
              :color="store.showPreview ? 'primary' : 'neutral'"
              variant="soft"
              @click="store.togglePreview"
            >
              <Icon name="lucide:eye" class="w-5 h-5 mr-2" />
              {{ t('common.preview') }}
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
                {{ t('common.restore') }}
              </UButton>
              <UButton
                v-else-if="store.draft.id && store.draft.status !== 'archived'"
                color="error"
                variant="soft"
                @click="handleArchive"
              >
                <Icon name="lucide:archive" class="w-5 h-5 mr-2" />
                {{ t('common.archive') }}
              </UButton>
              <UButton
                v-if="store.draft.id && store.draft.status === 'draft'"
                color="success"
                variant="soft"
                @click="handlePublish"
              >
                <Icon name="lucide:send" class="w-5 h-5 mr-2" />
                {{ t('common.publish') }}
              </UButton>
              <UButton
                v-else-if="store.draft.id && store.draft.status === 'published'"
                color="warning"
                variant="soft"
                @click="handleUnpublish"
              >
                <Icon name="lucide:archive" class="w-5 h-5 mr-2" />
                {{ t('common.unpublish') }}
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
              {{ store.draft.id ? t('common.update') : t('common.save') }}
            </UButton>
          </div>
        </div>

        <!-- Нижняя панель - ID поста -->
        <div v-if="store.draft.id" class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Icon name="lucide:hash" class="w-4 h-4" />
          <span>{{ t('common.id') }}: {{ store.draft.id }}</span>
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
        <span class="ml-2">{{ t('common.loading') }}</span>
      </div>
      <div v-else class="grid gap-6" :class="gridClass">
        <!-- Левая панель - Редактирование -->
        <div v-if="store.showCreate" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm relative">
          <UTooltip
            :text="!canEditPost ? 'Editing published post is not allowed' : ''"
            :disabled="canEditPost"
          >
            <div class="relative">
              <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-lg font-medium">
                  {{ t('common.create') }}
                </h2>
              </div>
              <div class="p-4">
                <PostsCreate 
                  :model-value="store.draft"
                  :disabled="!canEditPost"
                  :key="previewKey"
                  @update="handleFormUpdate"
                />
              </div>
              <div 
                v-if="!canEditPost" 
                class="absolute inset-0 bg-gray-900/50 dark:bg-gray-900/70 cursor-not-allowed"
              />
            </div>
          </UTooltip>
        </div>

        <!-- Средняя панель - AI -->
        <div v-if="store.showAiAgent" class="fixed top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg relative h-full border-2 border-blue-500 dark:border-blue-400"
          style="position: fixed !important; top: 16px !important; left: 16px !important; height: 70vh; display: flex; flex-direction: column; z-index: 50; width: 400px;"
          ref="aiPanelRef">
          <div class="relative h-full flex flex-col flex-1">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 cursor-move select-none"
              @mousedown="startDrag">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-medium">
                  {{ t('common.aiAssistant') }}
                </h2>
                <button
                  @click="store.toggleAiAgent"
                  class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <Icon name="lucide:x" class="w-5 h-5" />
                </button>
              </div>
            </div>
            <div class="flex-1 overflow-hidden">
              <PostsCreate 
                v-if="store.rightPanel === 'create'" 
                :model-value="store.draft"
                :disabled="!canEditPost"
                :key="`create-${previewKey}`"
                @update="handleFormUpdate"
              />
              <PostsAiagent v-else :post="store.draft" :disabled="!canEditPost" :key="`aiagent-${previewKey}`" style="height: 100%;" />
            </div>
          </div>
          
          <!-- Resize handle -->
          <div 
            class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity z-20"
            @mousedown="startResize"
          >
            <div class="w-full h-full flex items-end justify-end">
              <div class="w-3 h-3 border-r-2 border-b-2 border-gray-400 dark:border-gray-500"></div>
            </div>
          </div>
        </div>

        <!-- Правая панель - Превью -->
        <div v-if="store.showPreview" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-medium">
              {{ t('common.preview') }}
            </h2>
          </div>
          <div class="p-4">
            <PostsFull :post="store.draft" :key="previewKey" />
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useArticleBuilderStore } from '~/stores/articleBuilder'
import PostsCreate from '~/components/posts/create.vue'
import PostsFull from '~/components/posts/full.vue'
import PostsAiagent from '~/components/posts/aiagent.vue'
import { useUserStore } from '~/stores/user'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const store = useArticleBuilderStore()
const userStore = useUserStore()
const route = useRoute()
const { t } = useI18n()
const previewKey = ref(0)
const isLoading = ref(false)
const aiPanelRef = ref<HTMLElement>()

// Определение мобильного режима
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768 // md breakpoint
  store.setMobileMode(isMobile.value)
}

// Слушаем изменение размера окна
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// Следим за изменениями панелей и обновляем previewKey
watch(() => [store.showCreate, store.showPreview, store.showAiAgent], () => {
  previewKey.value++
})

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
    await store.loadPost(id)
    previewKey.value++
  } catch (error: any) {
    console.error(t('common.loadError'), error)
    useToast().add({
      title: t('common.error'),
      description: error.data?.message || t('common.loadError'),
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

// Watch for route changes
watch(
  () => route.query.id,
  async (newId, oldId) => {
    // Если у нас есть новый ID, загружаем пост
    if (newId) {
      await loadPost(newId as string)
    } 
    // Если ID был удален (стал null/undefined) и у нас был старый ID, 
    // то это означает переход к созданию нового поста
    else if (oldId && !newId) {
      store.resetDraft()
    }
    // Если ни нового, ни старого ID нет, ничего не делаем
    // (это может быть первая загрузка страницы)
  }
)

// Обновляем вычисляемое свойство для сетки
const gridClass = computed(() => {
  if (isMobile.value) {
    return 'grid-cols-1'
  }

  // Учитываем только edit и preview панели для сетки, AI агент - это оверлей
  const panels = [
    store.showCreate,
    store.showPreview
  ].filter(Boolean).length

  switch (panels) {
    case 1:
      return 'grid-cols-1'
    case 2:
      return 'grid-cols-2'
    default:
      return 'grid-cols-1'
  }
})

// Обработчик обновления формы
const handleFormUpdate = (newForm: Partial<Post>) => {
  // Обновляем store только если это не внешнее обновление и данные действительно изменились
  if (store.lastExternalUpdate === 0 || Date.now() - store.lastExternalUpdate > 2000) {
    // Проверяем, что данные действительно изменились
    const hasChanges = 
      newForm.title !== store.draft.title ||
      newForm.content !== store.draft.content ||
      newForm.annotation !== store.draft.annotation ||
      JSON.stringify(newForm.keywords) !== JSON.stringify(store.draft.keywords) ||
      JSON.stringify(newForm.subjectAreas) !== JSON.stringify(store.draft.subjectAreas) ||
      newForm.cover !== store.draft.cover ||
      newForm.status !== store.draft.status
    
    if (hasChanges) {
      store.updateDraft(newForm, false)
      // Обновляем previewKey только при значительных изменениях
      if (newForm.content !== store.draft.content || newForm.title !== store.draft.title) {
        previewKey.value++
      }
    }
  }
}

// Handle save/update
const handleSave = async () => {
  console.log('handleSave', store.draft)
  try {
    const response = await $fetch<Post>(`/api/posts${store.draft.id ? `/${store.draft.id}` : ''}`, {
      method: store.draft.id ? 'put' : 'post',
      body: store.draft
    })
    console.log('handleSave response', response)
    if (response) {
      store.updateDraft(response, true)
      previewKey.value++ // Обновляем превью после сохранения
      useToast().add({
        title: t('common.success'),
        description: store.draft.id ? t('common.postUpdated') : t('common.postCreated'),
        color: 'success'
      })
    }
  } catch (error: any) {
    console.error('Error saving post:', error)
    useToast().add({
      title: t('common.error'),
      description: error.data?.message || t('common.saveError'),
      color: 'error'
    })
    
    // If unauthorized, redirect to home
    if (error.statusCode === 401 || error.statusCode === 403) {
      navigateTo('/')
    }
  }
}

// Copy ID to clipboard
const copyId = async () => {
  if (!store.draft.id) return
  
  try {
    await navigator.clipboard.writeText(store.draft.id)
    useToast().add({
      title: t('common.success'),
      description: t('common.idCopied'),
      color: 'success'
    })
  } catch (error) {
    useToast().add({
      title: t('common.error'),
      description: t('common.idCopyError'),
      color: 'error'
    })
  }
}

// Handle publish
const handlePublish = async () => {
  if (!store.draft.id) return
  console.log('handlePublish', store.draft)
  try {
    const response = await $fetch<Post>(`/api/posts/${store.draft.id}`, {
      method: 'put',
      body: {
        ...store.draft,
        status: 'published'
      }
    })
    console.log('handlePublish response', response)
    if (response) {
      store.updateDraft(response)
      useToast().add({
        title: t('common.success'),
        description: t('common.postPublished'),
        color: 'success'
      })
    }
  } catch (error: any) {
    console.error('Error publishing post:', error)
    useToast().add({
      title: t('common.error'),
      description: error.data?.message || t('common.publishError'),
      color: 'error'
    })
    
    // If unauthorized, redirect to home
    if (error.statusCode === 401 || error.statusCode === 403) {
      navigateTo('/')
    }
  }
}

// Handle unpublish
const handleUnpublish = async () => {
  if (!store.draft.id) return
  console.log('handleUnpublish', store.draft)
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
      useToast().add({
        title: t('common.success'),
        description: t('common.postUnpublished'),
        color: 'success'
      })
    }
  } catch (error: any) {
    console.error('Error unpublishing post:', error)
    useToast().add({
      title: t('common.error'),
      description: error.data?.message || t('common.unpublishError'),
      color: 'error'
    })
    
    // If unauthorized, redirect to home
    if (error.statusCode === 401 || error.statusCode === 403) {
      navigateTo('/')
    }
  }
}

// Handle archive
const handleArchive = async () => {
  if (!store.draft.id) return
  console.log('handleArchive', store.draft)
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
      useToast().add({
        title: t('common.success'),
        description: t('common.postArchived'),
        color: 'success'
      })
    }
  } catch (error: any) {
    console.error('Error archiving post:', error)
    useToast().add({
      title: t('common.error'),
      description: error.data?.message || t('common.archiveError'),
      color: 'error'
    })
    
    // If unauthorized, redirect to home
    if (error.statusCode === 401 || error.statusCode === 403) {
      navigateTo('/')
    }
  }
}

// Handle restore
const handleRestore = async () => {
  if (!store.draft.id) return
  console.log('handleRestore', store.draft)
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
      useToast().add({
        title: t('common.success'),
        description: t('common.postRestored'),
        color: 'success'
      })
    }
  } catch (error: any) {
    console.error('Error restoring post:', error)
    useToast().add({
      title: t('common.error'),
      description: error.data?.message || t('common.restoreError'),
      color: 'error'
    })
    
    // If unauthorized, redirect to home
    if (error.statusCode === 401 || error.statusCode === 403) {
      navigateTo('/')
    }
  }
}

// Handle new project
const handleNewProject = () => {
  store.resetDraft()
  navigateTo('/ideas/article-builder')
}

// Функция для изменения размера AI агента
const startResize = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  const aiPanel = aiPanelRef.value
  if (!aiPanel) return
  
  const startX = event.clientX
  const startY = event.clientY
  const startWidth = aiPanel.offsetWidth
  const startHeight = aiPanel.offsetHeight
  
  const handleMouseMove = (e: MouseEvent) => {
    e.preventDefault()
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY
    
    const newWidth = Math.max(300, startWidth + deltaX)
    const newHeight = Math.max(400, startHeight + deltaY)
    
    aiPanel.style.width = `${newWidth}px`
    aiPanel.style.height = `${newHeight}px`
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// Функция для перетаскивания AI агента
const startDrag = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  const aiPanel = aiPanelRef.value
  if (!aiPanel) return
  
  const startX = event.clientX
  const startY = event.clientY
  const startLeft = aiPanel.offsetLeft
  const startTop = aiPanel.offsetTop
  
  const handleMouseMove = (e: MouseEvent) => {
    e.preventDefault()
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY
    
    const newLeft = startLeft + deltaX
    const newTop = startTop + deltaY
    
    // Ограничиваем перемещение в пределах окна
    const maxLeft = window.innerWidth - aiPanel.offsetWidth
    const maxTop = window.innerHeight - aiPanel.offsetHeight
    
    const constrainedLeft = Math.max(0, Math.min(newLeft, maxLeft))
    const constrainedTop = Math.max(0, Math.min(newTop, maxTop))
    
    aiPanel.style.left = `${constrainedLeft}px`
    aiPanel.style.top = `${constrainedTop}px`
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
</script>