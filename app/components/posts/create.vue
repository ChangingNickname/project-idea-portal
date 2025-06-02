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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const emit = defineEmits(['update'])

// Форма
const form = ref<Partial<Post>>({
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
  comments: 0
})

// Синхронизация с props
const props = defineProps<{
  modelValue: Partial<Post>
}>()

// Инициализация формы при монтировании
onMounted(() => {
  form.value = { ...props.modelValue }
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
    comments: 0
  }
  emit('update', form.value)
}
</script>