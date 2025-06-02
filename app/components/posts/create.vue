<template>
  <div class="space-y-6">
    <!-- Заголовок -->
    <div>
      <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Заголовок
      </label>
      <input
        id="title"
        v-model="form.title"
        type="text"
        required
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        placeholder="Введите заголовок статьи"
      />
    </div>

    <!-- Авторы -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Авторы
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
            <span class="ml-1 text-xs text-primary-500">(владелец)</span>
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
                class="ml-1 inline-flex text-primary-400 hover:text-primary-500"
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
            @click="showAuthorsSearch = true"
          >
            <Icon name="lucide:user-plus" class="w-4 h-4 mr-1" />
            Добавить автора
          </UButton>
        </div>
      </div>
    </div>

    <!-- Обложка -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Обложка
      </label>
      <div class="mt-1 flex items-center gap-4">
        <img
          v-if="form.cover"
          :src="form.cover"
          alt="Обложка"
          class="h-32 w-32 object-cover rounded-lg"
        />
        <input
          type="file"
          accept="image/*"
          @change="handleCoverUpload"
          class="block w-full text-sm text-gray-500 dark:text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-medium
            file:bg-primary-50 file:text-primary-700
            dark:file:bg-primary-900 dark:file:text-primary-300
            hover:file:bg-primary-100 dark:hover:file:bg-primary-800"
        />
      </div>
    </div>

    <!-- Аннотация -->
    <div>
      <label for="annotation" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Аннотация
      </label>
      <textarea
        id="annotation"
        v-model="form.annotation"
        rows="3"
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        placeholder="Краткое описание статьи"
      />
    </div>

    <!-- Ключевые слова -->
    <div>
      <label for="keywords" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Ключевые слова
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
              class="ml-1 inline-flex text-primary-400 hover:text-primary-500"
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
            class="block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="Введите ключевые слова через запятую"
            @keydown.enter.prevent="addKeywords"
          />
          <UButton
            type="button"
            color="primary"
            variant="soft"
            @click="addKeywords"
          >
            Добавить
          </UButton>
        </div>
      </div>
    </div>

    <!-- Домен -->
    <div>
      <label for="domain" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Домен
      </label>
      <input
        id="domain"
        v-model="form.domain"
        type="text"
        required
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        placeholder="Например: web-development"
      />
    </div>

    <!-- Контент -->
    <div>
      <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Содержание
      </label>
      <textarea
        id="content"
        v-model="form.content"
        rows="10"
        required
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-mono"
        placeholder="Напишите содержание статьи в формате Markdown"
      />
    </div>

    <!-- Политика выполнения -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Политика выполнения
      </label>
      <div class="mt-1 flex gap-4">
        <label class="inline-flex items-center">
          <input
            type="radio"
            v-model="form.executionPolicy"
            value="public"
            class="form-radio text-primary-600"
          />
          <span class="ml-2">Публичный</span>
        </label>
        <label class="inline-flex items-center">
          <input
            type="radio"
            v-model="form.executionPolicy"
            value="contest"
            class="form-radio text-primary-600"
          />
          <span class="ml-2">Конкурс</span>
        </label>
      </div>
    </div>

    <!-- Максимальное количество участников (только для конкурса) -->
    <div v-if="form.executionPolicy === 'contest'">
      <label for="maxParticipants" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Максимальное количество участников
      </label>
      <input
        id="maxParticipants"
        v-model.number="form.maxParticipants"
        type="number"
        min="1"
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500"
      />
    </div>

    <!-- Дедлайн (только для конкурса) -->
    <div v-if="form.executionPolicy === 'contest'">
      <label for="deadline" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Дедлайн
      </label>
      <input
        id="deadline"
        v-model="form.deadline"
        type="datetime-local"
        class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-sm focus:border-primary-500 focus:ring-primary-500"
      />
    </div>

    <!-- Кнопки управления -->
    <div class="flex justify-end">
      <UButton
        type="button"
        color="neutral"
        variant="soft"
        @click="resetForm"
      >
        Сбросить
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
              Добавить авторов
            </h2>

            <UserSearch
              v-model="selectedAuthors"
              @select="handleAddAuthors"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import UserSearch from '~/components/user/search.vue'
import { useUserStore } from '~/stores/user'
import Avatar from '~/components/user/Avatar.vue'

const emit = defineEmits(['update'])
const userStore = useUserStore()

type ExecutionPolicy = 'public' | 'contest'

interface FormData {
  title: string
  cover: string | null
  annotation: string
  keywords: string[]
  domain: string
  content: string
  status: 'draft'
  executionPolicy: ExecutionPolicy
  participants: {
    userId: string
    user: User
    status: 'pending' | 'approved' | 'rejected'
    joinedAt: string
    approvedAt?: string
    approvedBy?: string
  }[]
  currentParticipants: number
  views: number
  likes: number
  comments: number
  author: User[]
  authorId: string[]
  maxParticipants?: number
  deadline?: string
}

// Форма
const form = ref<FormData>({
  title: '',
  cover: null,
  annotation: '',
  keywords: [],
  domain: '',
  content: '',
  status: 'draft',
  executionPolicy: 'public',
  participants: [],
  currentParticipants: 0,
  views: 0,
  likes: 0,
  comments: 0,
  author: [],
  authorId: []
})

// Вычисляемое свойство для дополнительных авторов
const additionalAuthors = computed(() => {
  return form.value.author.filter(a => a?.id !== userStore.user?.id)
})

// Инициализация автора при монтировании
onMounted(() => {
  if (userStore.user) {
    form.value.author = [userStore.user]
    form.value.authorId = [userStore.user.id]
    emit('update', form.value)
  }
})

// Синхронизация с props
const props = defineProps<{
  modelValue: Partial<Post>
}>()

// Инициализация формы при монтировании
onMounted(() => {
  // Безопасно обновляем форму из props
  if (props.modelValue) {
    form.value = {
      title: props.modelValue.title || '',
      cover: props.modelValue.cover || null,
      annotation: props.modelValue.annotation || '',
      keywords: props.modelValue.keywords || [],
      domain: props.modelValue.domain || '',
      content: props.modelValue.content || '',
      status: 'draft',
      executionPolicy: (props.modelValue.executionPolicy as ExecutionPolicy) || 'public',
      participants: props.modelValue.participants || [],
      currentParticipants: props.modelValue.currentParticipants || 0,
      views: props.modelValue.views || 0,
      likes: props.modelValue.likes || 0,
      comments: props.modelValue.comments || 0,
      author: props.modelValue.author || [],
      authorId: props.modelValue.authorId || [],
      maxParticipants: props.modelValue.maxParticipants,
      deadline: props.modelValue.deadline
    }
  }
})

// Синхронизация в родительский компонент
watch(form, (newForm) => {
  emit('update', newForm)
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
    title: '',
    cover: null,
    annotation: '',
    keywords: [],
    domain: '',
    content: '',
    status: 'draft',
    executionPolicy: 'public',
    participants: [],
    currentParticipants: 0,
    views: 0,
    likes: 0,
    comments: 0,
    author: [],
    authorId: []
  }
  emit('update', form.value)
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

    emit('update', form.value)
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
    emit('update', form.value)
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
</script>