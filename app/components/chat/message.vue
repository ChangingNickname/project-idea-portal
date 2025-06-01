<template>
  <div class="flex gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
    <div class="flex-shrink-0">
      <Card :user="user" />
    </div>
    <div class="flex-1 min-w-0">
      <div class="markdown-body dark:markdown-body-dark">
        <div v-html="safeMessage" />
      </div>
      <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {{ formatDate(timestamp) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Card from '~/components/user/Card.vue'
import { computed, ref, watchEffect } from 'vue'

const props = defineProps<{
  user: User
  message: string
  timestamp: number
}>()

// Настройка marked для безопасного рендеринга
marked.setOptions({
  breaks: true,
  gfm: true
})

// Рендерим markdown с очисткой от потенциально опасного HTML
const renderedMessage = computed(async () => {
  const rawHtml = await marked.parse(props.message)
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'code', 'pre', 'blockquote',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
  })
})

// Используем v-html с обработанным сообщением
const safeMessage = ref('')

watchEffect(async () => {
  safeMessage.value = await renderedMessage.value
})

// Форматирование даты
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style>
/* Импортируем стили для markdown */
@import 'github-markdown-css/github-markdown.css';

/* Темная тема для markdown */
.markdown-body-dark {
  color: #e5e7eb;
}

.markdown-body-dark a {
  color: #60a5fa;
}

.markdown-body-dark code {
  background-color: #374151;
  color: #e5e7eb;
}

.markdown-body-dark pre {
  background-color: #374151;
}

.markdown-body-dark blockquote {
  border-left-color: #4b5563;
  color: #9ca3af;
}

.markdown-body-dark table {
  border-color: #4b5563;
}

.markdown-body-dark table tr {
  background-color: #1f2937;
  border-top-color: #4b5563;
}

.markdown-body-dark table tr:nth-child(2n) {
  background-color: #111827;
}

.markdown-body-dark table th,
.markdown-body-dark table td {
  border-color: #4b5563;
}

.markdown-body-dark hr {
  background-color: #4b5563;
}

/* Адаптивные стили */
.markdown-body {
  font-size: 0.875rem;
  line-height: 1.5;
}

@media (min-width: 768px) {
  .markdown-body {
    font-size: 1rem;
  }
}
</style>
