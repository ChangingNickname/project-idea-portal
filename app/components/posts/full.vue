<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- Заголовок -->
      <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {{ post.title || t('post.view.noTitle') }}
      </h1>

      <!-- Авторы -->
      <div v-if="post.author && post.author.length" class="mt-8">
        <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {{ t('post.authors') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Владелец -->
          <div v-if="post.owner" class="flex flex-col gap-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('post.author') }}</span>
            <UserCard :user="post.owner" />
            <template v-if="userStore.user && post.owner && userStore.user.id !== post.owner.id">
              <UButton
                v-if="!isParticipant"
                :to="`/user/${post.owner.id}/chat`"
                color="primary"
                class="inline-flex items-center gap-2"
                :title="t('post.view.joinTooltip')"
                @click.prevent="sendJoinRequest"
              >
                <Icon name="lucide:message-square" class="w-4 h-4" />
                {{ t('post.view.join') }}
              </UButton>
              <UButton
                v-else
                color="error"
                variant="soft"
                class="inline-flex items-center gap-2"
                :title="t('post.view.leaveTooltip')"
                @click="leaveProject"
              >
                <Icon name="lucide:log-out" class="w-4 h-4" />
                {{ t('post.view.leave') }}
              </UButton>
            </template>
          </div>
          <!-- Соавторы -->
          <template v-if="post.author.filter(a => a?.id !== post.owner?.id).length">
            <div class="flex flex-col gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('post.coAuthors') }}</span>
              <UserCard 
                v-for="author in post.author.filter(a => a?.id !== post.owner?.id)" 
                :key="author.id"
                :user="author"
              />
            </div>
          </template>
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
        <UButton
          :color="isLiked ? 'primary' : 'neutral'"
          variant="ghost"
          :ui="{ 
            base: 'flex items-center gap-2 px-2 py-1',
            color: {
              primary: 'text-primary-500 dark:text-primary-400',
              neutral: 'text-gray-500 dark:text-gray-400'
            }
          }"
          :disabled="isLiking"
          @click="toggleLike"
        >
          <Icon 
            name="lucide:heart" 
            class="w-4 h-4" 
            :class="{ 
              'fill-current text-primary-500 dark:text-primary-400': isLiked,
              'text-gray-500 dark:text-gray-400': !isLiked 
            }" 
          />
          {{ post.likes || 0 }} {{ t('post.view.likes') }}
        </UButton>
      </div>

      <!-- Участники -->
      <div v-if="post.currentParticipants && post.currentParticipants.length > 0" class="flex flex-col gap-2">
        <span class="text-sm text-gray-500 dark:text-gray-400">{{ t('post.participants') }}</span>
        <div class="flex flex-wrap gap-2">
          <div v-for="participantId in post.currentParticipants" :key="participantId" class="relative group">
            <UserCard :user="participants[participantId] || { id: participantId }" />
            <!-- Кнопка удаления для автора -->
            <UButton
              v-if="userStore.user && post.owner && userStore.user.id === post.owner.id && participantId !== post.owner.id"
              color="error"
              variant="soft"
              size="xs"
              icon="i-lucide-x"
              class="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              :title="t('post.view.removeParticipant')"
              @click="removeParticipant(participantId)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { computed, ref, watchEffect, watch, onMounted } from 'vue'
import hljs from 'highlight.js'
import 'highlight.js/styles/vs2015.css'
import UserCard from '~/components/user/Card.vue'
import { useUserStore } from '~/stores/user'
import { useRouter } from 'vue-router'

const props = defineProps<{
  post: Partial<Post>
}>()

const { t } = useI18n()
const userStore = useUserStore()
const router = useRouter()

// Состояние лайка
const isLiked = ref(false)
const isLiking = ref(false)
const isParticipant = ref(false)
const lastLikeTime = ref(0)
const LIKE_DEBOUNCE = 1000 // Минимальный интервал между лайками в мс
const participants = ref<Record<string, User>>({})

// Загружаем профили участников
const loadParticipantProfile = async (participantId: string) => {
  if (participants.value[participantId]) return

  try {
    const profile = await $fetch<User>(`/api/user/${participantId}/profile`)
    participants.value[participantId] = profile
  } catch (error) {
    console.error('Failed to load participant profile:', error)
  }
}

// Загружаем профили при монтировании
onMounted(async () => {
  if (props.post.currentParticipants?.length) {
    await Promise.all(
      props.post.currentParticipants.map(participantId => loadParticipantProfile(participantId))
    )
  }
})

// Проверяем, лайкнул ли текущий пользователь пост
onMounted(() => {
  if (userStore.user && props.post.viewedBy) {
    isLiked.value = props.post.viewedBy.includes(userStore.user.id)
  }
})

// Проверяем, является ли пользователь участником
onMounted(() => {
  if (userStore.user && props.post.currentParticipants) {
    isParticipant.value = props.post.currentParticipants.includes(userStore.user.id)
  }
})

// Увеличиваем счетчик просмотров
const incrementViews = async () => {
  if (!props.post.id) return
  
  try {
    const newViews = (props.post.views || 0) + 1
    await $fetch(`/api/posts/meta/${props.post.id}`, {
      method: 'POST',
      body: {
        views: newViews
      }
    })
    if (props.post) {
      props.post.views = newViews
    }
  } catch (error) {
    console.error('Failed to increment views:', error)
  }
}

// Загружаем данные при монтировании
onMounted(async () => {
  await incrementViews()
})

// Функция для лайка/анлайка
const toggleLike = async () => {
  if (!userStore.user || !props.post.id || isLiking.value) return

  try {
    isLiking.value = true

    // Проверяем текущее состояние лайка
    const currentIsLiked = props.post.viewedBy?.includes(userStore.user.id) || false
    const newLikes = currentIsLiked ? Math.max(0, (props.post.likes || 0) - 1) : (props.post.likes || 0) + 1
    const newViewedBy = currentIsLiked 
      ? (props.post.viewedBy || []).filter(id => id !== userStore.user?.id)
      : [...(props.post.viewedBy || []), userStore.user.id]

    const updatedPost = await $fetch(`/api/posts/meta/${props.post.id}`, {
      method: 'POST',
      body: {
        likes: newLikes,
        viewedBy: newViewedBy
      }
    })

    // Обновляем локальное состояние
    isLiked.value = !currentIsLiked
    if (props.post) {
      props.post.likes = updatedPost.likes
      props.post.viewedBy = updatedPost.viewedBy
    }
  } catch (error) {
    console.error('Failed to toggle like:', error)
    useToast().add({
      title: t('common.error'),
      description: t('common.failedToUpdateLike'),
      color: 'error'
    })
  } finally {
    setTimeout(() => {
      isLiking.value = false
    }, 500)
  }
}

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

const sendJoinRequest = async () => {
  if (!userStore.user || !props.post.owner || !props.post.id || !props.post.title) return

  try {
    const message = `Пользователь желает принять участие в проекте "${props.post.title}" (ID: ${props.post.id})\n\nПринять его?\n\n[Да](/api/user/${props.post.owner.id}/join/${props.post.id}?accept=true)\n[Нет](/api/user/${props.post.owner.id}/join/${props.post.id}?accept=false)`

    await $fetch(`/api/user/${props.post.owner.id}/message`, {
      method: 'POST',
      body: {
        message,
        type: 'join_request',
        metadata: {
          postId: props.post.id,
          postTitle: props.post.title,
          requesterId: userStore.user.id
        }
      }
    })

    router.push(`/user/${props.post.owner.id}/chat`)
  } catch (error) {
    console.error('Failed to send join request:', error)
  }
}

// Функция для выхода из проекта
const leaveProject = async () => {
  if (!userStore.user || !props.post.owner || !props.post.id) return

  try {
    const updatedPost = await $fetch<Post>(`/api/posts/${props.post.id}`, {
      method: 'PUT',
      body: {
        action: 'leaveProject'
      }
    })

    // Обновляем локальное состояние
    isParticipant.value = false
    if (props.post) {
      props.post.currentParticipants = updatedPost.currentParticipants
    }

    useToast().add({
      title: t('common.success'),
      description: t('post.view.leftProject'),
      color: 'success'
    })
  } catch (error) {
    console.error('Failed to leave project:', error)
    useToast().add({
      title: t('common.error'),
      description: t('post.view.failedToLeave'),
      color: 'error'
    })
  }
}

// Функция для удаления участника
const removeParticipant = async (participantId: string) => {
  if (!userStore.user || !props.post.owner || !props.post.id) return

  try {
    // Получаем текущих участников и удаляем указанного
    const currentParticipants = Array.isArray(props.post.currentParticipants) 
      ? props.post.currentParticipants 
      : []
    const updatedParticipants = currentParticipants.filter(id => id !== participantId)

    const updatedPost = await $fetch<Post>(`/api/posts/${props.post.id}`, {
      method: 'PUT',
      body: {
        currentParticipants: updatedParticipants
      }
    })

    // Обновляем локальное состояние
    if (props.post) {
      props.post.currentParticipants = updatedPost.currentParticipants
    }

    useToast().add({
      title: t('common.success'),
      description: t('post.view.participantRemoved'),
      color: 'success'
    })
  } catch (error) {
    console.error('Failed to remove participant:', error)
    useToast().add({
      title: t('common.error'),
      description: t('post.view.failedToRemoveParticipant'),
      color: 'error'
    })
  }
}
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
