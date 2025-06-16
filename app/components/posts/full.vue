<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- Заголовок -->
      <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {{ post.title || t('post.view.noTitle') }}
      </h1>

      <!-- Авторы -->
      <div v-if="post.author && post.author.length" class="mb-8">
        <div class="flex flex-wrap gap-4 items-center">
          <!-- Владелец -->
          <div class="flex flex-col items-start mr-6">
            <span class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ t('post.author') }}</span>
            <UserCard v-if="post.owner" :user="post.owner" />
          </div>
          <!-- Соавторы -->
          <div v-if="post.author.filter(a => a?.id !== post.owner?.id).length" class="flex flex-col items-start gap-2">
            <span class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ t('post.coAuthors') }}</span>
            <template v-for="author in post.author.filter(a => a?.id !== post.owner?.id)" :key="author.id">
              <UserCard :user="author" />
            </template>
          </div>
        </div>
      </div>

      <!-- Ключевые слова -->
      <div v-if="post.keywords?.length" class="mb-8 flex flex-wrap gap-2">
        <span 
          v-for="keyword in post.keywords" 
          :key="keyword"
          class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
        >
          {{ keyword }}
        </span>
      </div>

      <!-- Обложка -->
      <div v-if="post.cover" class="mb-8">
        <img 
          :src="post.cover" 
          :alt="post.title || t('post.view.cover')"
          class="w-full h-[400px] object-cover rounded-lg"
        />
      </div>

      <!-- Аннотация -->
      <div v-if="post.annotation" class="mb-8 text-lg text-gray-700 dark:text-gray-300">
        {{ post.annotation }}
      </div>

      <!-- Контент -->
      <div v-if="post.content" class="markdown-body rounded-lg p-6 bg-white dark:bg-gray-900">
        <div v-html="safeContent" />
      </div>

      <!-- Метаданные -->
      <div class="mt-8 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div class="flex items-center gap-2">
          <Icon name="lucide:eye" class="w-4 h-4" />
          {{ post.views || 0 }} {{ t('post.view.views') }}
        </div>
        <div class="flex items-center gap-2">
          <Icon name="lucide:heart" class="w-4 h-4" />
          {{ post.likes || 0 }} {{ t('post.view.likes') }}
        </div>
        <div class="flex items-center gap-2">
          <Icon name="lucide:users" class="w-4 h-4" />
          {{ post.currentParticipants || 0 }} {{ t('post.view.participants') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { computed, ref, watchEffect, watch } from 'vue'
import hljs from 'highlight.js'
import 'highlight.js/styles/vs2015.css'
import UserCard from '~/components/user/Card.vue'

const props = defineProps<{
  post: Partial<Post>
}>()

const { t } = useI18n()

// Настройка marked для безопасного рендеринга
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight(code: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        console.error('Error highlighting code:', err)
      }
    }
    return code
  }
})

// Рендерим markdown с очисткой от потенциально опасного HTML
const renderedContent = computed(async () => {
  if (!props.post.content) return ''
  const rawHtml = await marked.parse(props.post.content)
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'code', 'pre', 'blockquote',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'span', 'div', 'mark', 'del', 'ins', 'sub', 'sup',
      // Теги для подсветки синтаксиса
      'hljs', 'hljs-keyword', 'hljs-string', 'hljs-number', 'hljs-comment',
      'hljs-function', 'hljs-title', 'hljs-params', 'hljs-literal', 'hljs-type',
      'hljs-operator', 'hljs-punctuation', 'hljs-property', 'hljs-attr',
      'hljs-selector', 'hljs-tag', 'hljs-name', 'hljs-attribute', 'hljs-variable',
      'hljs-regexp', 'hljs-built_in', 'hljs-symbol', 'hljs-bullet', 'hljs-link',
      'hljs-meta', 'hljs-deletion', 'hljs-addition', 'hljs-emphasis', 'hljs-strong',
      'hljs-formula', 'hljs-quote', 'hljs-selector-tag', 'hljs-selector-id',
      'hljs-selector-class', 'hljs-template-variable', 'hljs-doctag', 'hljs-section',
      'hljs-subst', 'hljs-template-tag'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'name', 'target',
      'rel', 'style', 'data-*', 'aria-*', 'role'
    ]
  })
})

// Используем v-html с обработанным контентом
const safeContent = ref('')

watchEffect(async () => {
  safeContent.value = await renderedContent.value
})
</script>

<style>
/* Импортируем стили для markdown */
@import 'github-markdown-css/github-markdown.css';

/* Переопределяем стили для прозрачного фона */
.markdown-body {
  font-size: 1rem;
  line-height: 1.6;
  background: transparent;
  color: #171717;
}

.dark .markdown-body {
  color: #fafafa;
}

.markdown-body pre {
  background: transparent !important;
  border: 1px solid #d4d4d4;
  padding: 1em;
  border-radius: 6px;
}

.dark .markdown-body pre {
  border-color: #404040;
}

.markdown-body code {
  background: transparent;
  border: 1px solid #d4d4d4;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  color: #171717;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
}

.dark .markdown-body code {
  border-color: #404040;
  color: #fafafa;
}

/* Стили для подсветки синтаксиса */
.markdown-body pre code {
  border: none;
  padding: 0;
  background: transparent;
}

/* Светлая тема */
.markdown-body .hljs {
  background: #1e1e1e !important;
  color: #d4d4d4 !important;
}

/* Темная тема */
.dark .markdown-body .hljs {
  background: #1e1e1e !important;
  color: #d4d4d4 !important;
}

.markdown-body blockquote {
  background: transparent;
  border-left: 4px solid #d4d4d4;
  color: #525252;
}

.dark .markdown-body blockquote {
  border-left-color: #404040;
  color: #a3a3a3;
}

.markdown-body table {
  background: transparent;
}

.markdown-body table tr {
  background: transparent;
  border-top: 1px solid #d4d4d4;
}

.dark .markdown-body table tr {
  border-top-color: #404040;
}

.markdown-body table tr:nth-child(2n) {
  background: transparent;
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid #d4d4d4;
}

.dark .markdown-body table th,
.dark .markdown-body table td {
  border-color: #404040;
}

.markdown-body hr {
  background: transparent;
  border-bottom: 1px solid #d4d4d4;
}

.dark .markdown-body hr {
  border-bottom-color: #404040;
}

.markdown-body a {
  color: #2563eb;
  text-decoration: none;
}

.dark .markdown-body a {
  color: #60a5fa;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  color: #171717;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.dark .markdown-body h1,
.dark .markdown-body h2,
.dark .markdown-body h3,
.dark .markdown-body h4,
.dark .markdown-body h5,
.dark .markdown-body h6 {
  color: #fafafa;
}

@media (min-width: 768px) {
  .markdown-body {
    font-size: 1.125rem;
  }
}
</style>
