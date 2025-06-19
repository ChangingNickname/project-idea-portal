<template>
  <div class="space-y-6">
    <!-- Заголовок -->
    <div>
      <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ t('post.create.title') }}
      </label>
      <input
        id="title"
        v-model="form.title"
        type="text"
        required
        :disabled="isDisabled"
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        :placeholder="t('post.create.titlePlaceholder')"
      />
    </div>

    <!-- Авторы -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ t('post.create.authors') }}
      </label>
      <div class="mt-1">
        <div class="flex flex-wrap gap-2 mb-2">
          <!-- Владелец -->
          <div
            v-if="userStore.user"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300"
          >
            <Avatar
              :src="userStore.user.avatar || undefined"
              :email="userStore.user.email || undefined"
              :alt="userStore.user.displayName || 'Owner avatar'"
              :isActive="userStore.user.emailVerified"
              size="sm"
            />
            <span class="ml-1">{{ userStore.user.displayName || userStore.user.email }}</span>
            <span class="ml-1 text-xs text-primary-500">({{ t('post.owner') }})</span>
          </div>

          <!-- Дополнительные авторы -->
          <div v-if="additionalAuthors.length > 0" class="flex flex-wrap gap-2">
            <div
              v-for="author in additionalAuthors"
              :key="author.id"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300"
            >
              <Avatar
                :src="author.avatar || undefined"
                :email="author.email || undefined"
                :alt="author.displayName || 'Author avatar'"
                :isActive="author.emailVerified"
                size="sm"
              />
              <span class="ml-1">{{ author.displayName || author.email }}</span>
              <button
                type="button"
                @click="removeAuthor(author.id)"
                :disabled="isDisabled"
                class="ml-1 inline-flex text-primary-400 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name="lucide:x" class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <UButton
            type="button"
            color="primary"
            variant="soft"
            :disabled="isDisabled"
            @click="showAuthorsSearch = true"
          >
            <Icon name="lucide:user-plus" class="w-4 h-4 mr-1" />
            {{ t('post.create.addAuthor') }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Обложка -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ t('post.create.cover') }}
      </label>
      <div class="mt-1 flex items-center gap-4">
        <img
          v-if="form.cover"
          :src="form.cover"
          :alt="t('post.create.cover')"
          class="h-32 w-32 object-cover rounded-lg"
        />
        <input
          type="file"
          accept="image/*"
          :disabled="isDisabled"
          @change="handleCoverUpload"
          class="block w-full text-sm text-gray-500 dark:text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-medium
            file:bg-primary-50 file:text-primary-700
            dark:file:bg-primary-900 dark:file:text-primary-300
            hover:file:bg-primary-100 dark:hover:file:bg-primary-800
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>

    <!-- Аннотация -->
    <div>
      <label for="annotation" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ t('post.create.annotation') }}
      </label>
      <textarea
        id="annotation"
        v-model="form.annotation"
        rows="3"
        :disabled="isDisabled"
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        :placeholder="t('post.create.annotationPlaceholder')"
      />
    </div>

    <!-- Ключевые слова -->
    <div>
      <label for="keywords" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ t('post.create.keywords') }}
      </label>
      <div class="mt-1">
        <div class="flex flex-wrap gap-2 mb-2">
          <span
            v-for="keyword in form.keywords"
            :key="keyword"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300"
          >
            {{ keyword }}
            <button
              type="button"
              @click="removeKeyword(keyword)"
              :disabled="isDisabled"
              class="ml-1 inline-flex text-primary-400 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="lucide:x" class="w-3 h-3" />
            </button>
          </span>
        </div>
        <div class="flex gap-2">
          <input
            id="keywords"
            v-model="newKeyword"
            type="text"
            :disabled="isDisabled"
            class="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            :placeholder="t('post.create.keywordsPlaceholder')"
            @keydown.enter.prevent="addKeywords"
            @blur="addKeywords"
          />
        </div>
      </div>
    </div>

    <!-- Предметные области -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ t('common.subjectAreas') }}
      </label>
      <div class="mt-1">
        <div class="space-y-4">
          <UButton
            color="neutral"
            variant="soft"
            class="w-full flex items-center justify-between"
            data-subject-area-button
            @click="showSubjectAreas = true"
          >
            <span>
              {{ form.subjectAreas.length 
                ? t('common.selectedAreas', { count: form.subjectAreas.length })
                : t('common.selectSubjectAreas') 
              }}
            </span>
            <UIcon name="i-lucide-chevron-right" class="w-5 h-5" />
          </UButton>

          <!-- Selected Areas Display -->
          <div v-if="form.subjectAreas.length" class="flex flex-wrap gap-2">
            <UBadge
              v-for="area in form.subjectAreas"
              :key="area.key"
              color="primary"
              variant="soft"
              class="flex items-center gap-1"
            >
              {{ t(area.i18nKey) }}
              <UIcon
                name="i-lucide-x"
                class="w-4 h-4 cursor-pointer"
                @click="removeSubjectArea(area.key)"
              />
            </UBadge>
          </div>
        </div>
      </div>
    </div>

    <!-- Контент -->
    <div>
      <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ t('post.create.content') }}
      </label>
      <textarea
        id="content"
        v-model="form.content"
        rows="10"
        required
        :disabled="isDisabled"
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
        :placeholder="t('post.create.contentPlaceholder')"
      />
    </div>

    <!-- Кнопки управления -->
    <div class="flex justify-end">
      <UButton
        type="button"
        color="neutral"
        variant="soft"
        :disabled="isDisabled"
        @click="resetForm"
      >
        {{ t('post.create.reset') }}
      </UButton>
    </div>

    <!-- Модальное окно поиска авторов -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div v-if="showAuthorsSearch" class="fixed inset-0 z-50 flex items-center justify-center p-16">
          <div
            class="fixed inset-0 bg-black/50"
            @click="showAuthorsSearch = false"
          />

          <div
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto"
          >
            <button
              class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              @click="showAuthorsSearch = false"
            >
              <UIcon name="i-lucide-x" class="w-6 h-6" />
            </button>

            <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white pr-8">
              {{ t('post.create.addAuthors') }}
            </h2>

            <UserSearch
              v-model="selectedAuthors"
              @select="handleAddAuthors"
            />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модальное окно выбора предметных областей -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <SubjectArea
          v-if="showSubjectAreas"
          v-model="showSubjectAreas"
          :selected-areas="form.subjectAreas"
          @update:selected-areas="updateSubjectAreas"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import UserSearch from '~/components/user/search.vue'
import { useUserStore } from '~/stores/user'
import { useArticleBuilderStore } from '~/stores/articleBuilder'
import Avatar from '~/components/user/Avatar.vue'
import SubjectArea from '~/components/common/subjectarea.vue'

const emit = defineEmits(['update'])
const userStore = useUserStore()
const articleBuilderStore = useArticleBuilderStore()
const { t } = useI18n()

type ExecutionPolicy = 'public' | 'contest'

// Интерфейс для UI компонента выбора предметных областей
interface SubjectAreaUI {
  key: string
  label: string
  i18nKey: string
  icon?: string
}

// Форма
const form = ref<Post>({
  id: '',
  title: '',
  cover: null,
  annotation: '',
  content: '',
  keywords: [],
  subjectAreas: [],
  status: 'draft',
  deadline: undefined,
  author: [],
  authorId: [],
  owner: userStore.user!,
  ownerId: userStore.user?.id || '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  views: 0,
  likes: 0,
  viewedBy: []
})

// Вычисляемое свойство для дополнительных авторов
const additionalAuthors = computed(() => {
  return form.value.author.filter(a => a?.id !== userStore.user?.id)
})

// Инициализация автора при монтировании
onMounted(() => {
  // Сначала инициализируем форму из props, если они есть
  if (props.modelValue) {
    form.value = {
      ...form.value,
      ...props.modelValue
    }
  }
  
  // Затем устанавливаем автора, если его нет
  if (userStore.user && (!form.value.author || form.value.author.length === 0)) {
    form.value.author = [userStore.user]
    form.value.authorId = [userStore.user.id]
  }
})

// Синхронизация с props
const props = defineProps<{
  modelValue: Partial<Post>
  disabled: boolean
}>()

// Обновлять форму из props при любом изменении modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    form.value = {
      ...form.value,
      ...newValue
    }
  }
}, { deep: true, immediate: true })

// Debounce функция для оптимизации обновлений
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Debounced emit функция
const debouncedEmit = debounce((data: Partial<Post>) => {
  emit('update', data)
}, 300)

// Эмитить update только при реальных изменениях формы с debounce
watch(() => [form.value.id, form.value.title, form.value.cover, form.value.annotation, form.value.keywords, form.value.content, form.value.status], () => {
  // Проверяем, что это не внешнее обновление из store
  if (articleBuilderStore.lastExternalUpdate === 0 || Date.now() - articleBuilderStore.lastExternalUpdate > 1000) {
    debouncedEmit({ ...form.value })
  }
}, { deep: true })

// Новое ключевое слово
const newKeyword = ref('')

// Добавление ключевых слов
const addKeywords = () => {
  if (newKeyword.value.trim()) {
    const keywords = newKeyword.value
      .split(',')
      .map(k => k.trim())
      .filter(k => k && !form.value.keywords?.includes(k))
    
    if (keywords.length > 0) {
      form.value.keywords = [...(form.value.keywords || []), ...keywords]
      newKeyword.value = ''
    }
  }
}

// Удаление ключевого слова
const removeKeyword = (keyword: string) => {
  form.value.keywords = form.value.keywords?.filter(k => k !== keyword)
}

// Загрузка обложки
const handleCoverUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      form.value.cover = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// Сброс формы
const resetForm = () => {
  form.value = {
    id: '',
    title: '',
    cover: null,
    annotation: '',
    content: '',
    keywords: [],
    subjectAreas: [],
    status: 'draft',
    deadline: undefined,
    author: [],
    authorId: [],
    owner: userStore.user!,
    ownerId: userStore.user?.id || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    likes: 0,
    viewedBy: []
  }
  debouncedEmit(form.value)
}

// Состояние для модального окна поиска авторов
const showAuthorsSearch = ref(false)
const selectedAuthors = ref<string[]>([])

// Добавление авторов
const handleAddAuthors = async (userIds: string[]) => {
  try {
    const authors = await Promise.all(
      userIds.map(async (uid) => {
        const user = await $fetch<User>(`/api/user/${uid}/profile`)
        return user
      })
    )

    // Фильтруем дубликаты и текущего пользователя
    const existingAuthors = Array.isArray(form.value.author) ? form.value.author : []
    const newAuthors = authors.filter(a => 
      a.id !== userStore.user?.id && 
      !existingAuthors.some(existing => existing?.id === a.id)
    )

    // Обновляем список авторов
    form.value.author = [...existingAuthors, ...newAuthors]
    form.value.authorId = form.value.author.map(a => a?.id).filter(Boolean) as string[]

    // Закрываем модальное окно
    showAuthorsSearch.value = false
    selectedAuthors.value = []

    debouncedEmit(form.value)
  } catch (error) {
    console.error('Ошибка добавления авторов:', error)
  }
}

// Удаление автора (кроме текущего пользователя)
const removeAuthor = (authorId: string) => {
  if (Array.isArray(form.value.author)) {
    // Не позволяем удалить текущего пользователя
    if (authorId === userStore.user?.id) return
    
    form.value.author = form.value.author.filter(a => a?.id !== authorId)
    form.value.authorId = form.value.author.map(a => a?.id).filter(Boolean) as string[]
    debouncedEmit(form.value)
  }
}

// Закрытие по Escape
const closeOnEsc = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showAuthorsSearch.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', closeOnEsc)
})

onUnmounted(() => {
  document.removeEventListener('keydown', closeOnEsc)
})

// Вычисляемое свойство для определения, заблокирована ли форма
const isDisabled = computed(() => {
  return props.disabled || form.value.status === 'published' || form.value.status === 'archived'
})

// Следим за внешними обновлениями в store
watch(() => articleBuilderStore.lastExternalUpdate, (newTimestamp) => {
  if (newTimestamp > 0) {
    // Обновляем форму только если timestamp изменился
    form.value = {
      ...form.value,
      ...articleBuilderStore.draft
    }
  }
})

// Состояние для модального окна выбора предметных областей
const showSubjectAreas = ref(false)

// Обновление предметных областей
const updateSubjectAreas = (areas: SubjectAreaUI[]) => {
  if (!areas) return
  form.value.subjectAreas = areas.map(area => ({
    key: area.key,
    i18nKey: area.i18nKey
  }))
  debouncedEmit(form.value)
}

// Удаление предметной области
const removeSubjectArea = (key: string) => {
  form.value.subjectAreas = form.value.subjectAreas.filter(area => area.key !== key)
  debouncedEmit(form.value)
}
</script>