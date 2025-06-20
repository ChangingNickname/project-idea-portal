<template>
  <div 
    class="flex gap-3 p-4" 
    :class="[
      isCurrentUser ? 'flex-row-reverse' : 'flex-row',
      { 'justify-end': isCurrentUser }
    ]"
    ref="messageRef"
  >
    <div v-if="showUserInfo" class="flex-shrink-0">
      <Card :user="user" />
    </div>
    <div 
      :class="[
        'flex-1 min-w-0 max-w-[80%]',
        { 
          'ml-12': !showUserInfo && !isCurrentUser,
          'mr-12': !showUserInfo && isCurrentUser
        }
      ]"
    >
      <div v-if="showUserInfo" class="mb-1" :class="{ 'text-right': isCurrentUser }">
        <span class="text-sm font-medium text-gray-900 dark:text-white">
          {{ user.displayName || user.email }}
        </span>
      </div>
      <div 
        class="markdown-body rounded-lg p-3"
        :class="[
          isCurrentUser 
            ? 'bg-primary-500 text-white dark:bg-primary-600' 
            : 'bg-gray-100 dark:bg-gray-800'
        ]"
        @click="handleMessageClick"
      >
        <div v-html="safeMessage" />
      </div>
      <div 
        class="mt-2 flex items-center text-xs text-neutral-900/70 dark:text-neutral-100/70"
        :class="[
          isCurrentUser 
            ? 'justify-start flex-row-reverse' 
            : 'justify-start'
        ]"
      >
        <span>{{ formatDate(timestamp) }}</span>
        <div class="flex items-center gap-1" :class="{ 'ml-2': !isCurrentUser, 'mr-2': isCurrentUser }">
          <span v-if="readBy?.length" class="text-green-500">
            <Icon name="lucide:check-circle" class="w-4 h-4" />
            {{ readBy.length }} {{ readBy.length === 1 ? t('message.read.single') : t('message.read.multiple') }}
          </span>
          <span v-else-if="status === 'sending'" class="text-gray-400">
            <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            {{ t('message.status.sending') }}
          </span>
          <span v-else-if="status === 'sent'" class="text-gray-400">
            <Icon name="lucide:check" class="w-4 h-4" />
            {{ t('message.status.sent') }}
          </span>
          <span v-else-if="status === 'delivered'" class="text-blue-500">
            <Icon name="lucide:check-check" class="w-4 h-4" />
            {{ t('message.status.delivered') }}
          </span>
          <span v-else-if="status === 'error'" class="text-red-500">
            <Icon name="lucide:alert-circle" class="w-4 h-4" />
            {{ t('message.status.error') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Card from '~/components/user/Card.vue'
import { computed, ref, watchEffect, onMounted, onUnmounted } from 'vue'
import hljs from 'highlight.js'
import 'highlight.js/styles/vs2015.css'
import { useI18n } from 'vue-i18n'

interface MessageState {
  isEditing: boolean
  isDeleting: boolean
  isReplying: boolean
  editContent: string
  error: string | null
  isRead: boolean
  messageContent: string
}

interface JoinRequestResponse {
  accepted: boolean
  postId: string
  userId: string
}

const props = defineProps<{
  id?: string
  user: User
  message?: string
  timestamp?: number
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error'
  readBy?: {
    userId: string
    timestamp: number
  }[]
  showUserInfo?: boolean
  isCurrentUser?: boolean
  type?: string
  metadata?: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'markAsRead', messageId: string): void
  (e: 'joinRequestResponse', response: JoinRequestResponse): void
}>()

const state = ref<MessageState>({
  isEditing: false,
  isDeleting: false,
  isReplying: false,
  editContent: '',
  error: null,
  isRead: false,
  messageContent: props.message || ''
})

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
const renderedMessage = computed(async () => {
  if (!state.value.messageContent) return ''
  const rawHtml = await marked.parse(state.value.messageContent)
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

// Используем v-html с обработанным сообщением
const safeMessage = ref('')

watchEffect(async () => {
  safeMessage.value = await renderedMessage.value
})

// Форматирование даты
const formatDate = (timestamp?: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Отслеживаем прочтение сообщения
const markAsRead = () => {
  if (!state.value.isRead && props.id) {
    emit('markAsRead', props.id)
    state.value.isRead = true
  }
}

// Автоматически отмечаем сообщение как прочитанное при появлении в поле зрения
const messageRef = ref<HTMLElement | null>(null)
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      markAsRead()
    }
  })
})

onMounted(() => {
  if (messageRef.value) {
    observer.observe(messageRef.value)
  }
})

onUnmounted(() => {
  if (messageRef.value) {
    observer.unobserve(messageRef.value)
  }
})

// Обработка кликов по сообщению
const handleMessageClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.tagName === 'A') {
    event.preventDefault()
    const href = target.getAttribute('href')
    console.log('Clicked link:', {
      href,
      text: target.textContent,
      type: props.type,
      metadata: props.metadata
    })

    if (href) {
      if (href.startsWith('/api/')) {
        console.log('Processing API request:', href)
        
        // Проверяем, что это запрос на присоединение
        if (href.includes('/join/')) {
          const isAccepted = target.textContent?.toLowerCase() === 'yes'
          const postId = href.split('/join/')[1]?.split('?')[0]
          
          if (postId && props.metadata?.postId) {
            // Используем requesterId из метаданных, а не ID отправителя сообщения
            const userId = props.metadata.requesterId || props.user.id
            
            console.log('Emitting join request response:', {
              accepted: isAccepted,
              postId: props.metadata.postId,
              userId: userId
            })

            emit('joinRequestResponse', {
              accepted: isAccepted,
              postId: props.metadata.postId,
              userId: userId
            })
          }
        }

        // Обработка API запросов
        $fetch(href, { method: 'POST' })
          .then(() => {
            console.log('API request successful')
            // Обновляем сообщение после успешного ответа
            if (props.type === 'join_request' && props.metadata?.postId) {
              const accepted = target.textContent?.toLowerCase() === 'yes'
              console.log('Join request response:', {
                accepted,
                postId: props.metadata.postId,
                userId: props.user.id
              })

              // Обновляем текст сообщения
              const newMessage = props.message?.replace(
                /\[(Yes|No)\]\(.*?\)/g,
                (match, text) => `[${text}]`
              )
              if (newMessage) {
                console.log('Updating message content:', newMessage)
                // Используем локальное состояние вместо изменения props
                state.value.messageContent = newMessage
              }
            }
          })
          .catch(error => {
            console.error('Failed to process action:', error)
          })
      } else {
        // Обычные ссылки
        console.log('Opening external link:', href)
        window.open(href, '_blank')
      }
    }
  }
}
</script>

<style>
/* Импортируем стили для markdown */
@import 'github-markdown-css/github-markdown.css';

/* Переопределяем стили для прозрачного фона */
.markdown-body {
  font-size: 0.875rem;
  line-height: 1.5;
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
    font-size: 1rem;
  }
}
</style>
