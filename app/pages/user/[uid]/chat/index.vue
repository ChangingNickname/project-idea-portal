<template>
  <div class="flex flex-col h-[calc(100vh-4rem)]">
    <!-- Заголовок чата -->
    <div class="flex items-center justify-between p-4 border-b dark:border-neutral-800">
      <div class="flex items-center gap-3">
        <UserAvatar
          :src="user?.avatar"
          :email="user?.email"
          :alt="user?.displayName"
          :isActive="user?.emailVerified"
          size="md"
        />
        <div>
          <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ user?.displayName || user?.email }}
          </h1>
          <p v-if="user?.email && user?.displayName" class="text-sm text-gray-500 dark:text-gray-400">
            {{ user?.email }}
          </p>
        </div>
      </div>
    </div>

    <!-- Сообщения -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="messagesContainer">
      <div v-for="message in messages" :key="message.id">
        <ChatMessage
          v-if="message.id && message.message"
          :id="message.id"
          :user="message.from_user_id === currentUser?.id ? currentUser! : user!"
          :message="message.message"
          :timestamp="message.timestamp || new Date(message.created_at).getTime()"
          :status="message.status"
          :readBy="message.read_by"
          @markAsRead="markMessageAsRead"
        />
      </div>
    </div>

    <!-- Форма отправки -->
    <ChatCreate
      v-if="route.params.uid"
      :userId="route.params.uid as string"
      @messageSent="handleMessageSent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useUserStore } from '~/stores/user'

interface Message {
  id: string
  from_user_id: string
  to_user_id: string
  message: string
  type: 'text' | 'code' | 'image' | 'file'
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  read_at: string | null
  read_by: Array<{
    userId: string
    timestamp: number
  }>
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error'
  timestamp: number
}

const route = useRoute()
const { t } = useI18n()
const userStore = useUserStore()
const currentUser = userStore.user

// Состояние
const messages = ref<Message[]>([])
const messagesContainer = ref<HTMLElement | null>(null)
const user = ref<User | null>(null)
const unreadMessages = ref<number>(0)

// Получаем данные пользователя
const userData = await $fetch<User>(`/api/user/${route.params.uid}/profile`)
user.value = userData || null

// Загрузка сообщений
const loadMessages = async () => {
  if (!route.params.uid) return

  try {
    const data = await $fetch<Message[]>(`/api/user/${route.params.uid}/messages`)
    if (data) {
      messages.value = data.map(msg => ({
        ...msg,
        status: msg.status || 'sent',
        read_by: msg.read_by || [],
        timestamp: msg.timestamp || new Date(msg.created_at).getTime()
      }))
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    console.error('Error loading messages:', error)
  }
}

// Обработка отправленного сообщения
const handleMessageSent = (message: Message) => {
  if (!messages.value) {
    messages.value = []
  }

  // Если это временное сообщение (начинается с 'temp-')
  if (message.id.startsWith('temp-')) {
    // Ищем существующее временное сообщение
    const existingIndex = messages.value.findIndex(m => m.id === message.id)
    if (existingIndex !== -1) {
      // Обновляем существующее сообщение
      messages.value = [
        ...messages.value.slice(0, existingIndex),
        message,
        ...messages.value.slice(existingIndex + 1)
      ]
    } else {
      // Добавляем новое временное сообщение
      messages.value = [...messages.value, message]
    }
  } else {
    // Если это новое сообщение от сервера
    const existingIndex = messages.value.findIndex(m => m.id === message.id)
    if (existingIndex !== -1) {
      // Обновляем существующее сообщение
      messages.value = [
        ...messages.value.slice(0, existingIndex),
        message,
        ...messages.value.slice(existingIndex + 1)
      ]
    } else {
      // Добавляем новое сообщение
      messages.value = [...messages.value, message]
    }
  }

  nextTick(() => {
    scrollToBottom()
  })
}

// Отметка сообщений как прочитанных
const markMessageAsRead = async (messageId: string) => {
  if (!route.params.uid) return

  try {
    await $fetch<{ updated: number }>(`/api/user/${route.params.uid}/message`, {
      method: 'PUT',
      body: {
        messageIds: [messageId]
      }
    })
  } catch (error) {
    console.error('Error marking message as read:', error)
  }
}

// Прокрутка к последнему сообщению
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Проверка непрочитанных сообщений
const checkUnreadMessages = async () => {
  if (!route.params.uid) return

  try {
    const data = await $fetch<{ count: number }>(`/api/user/${route.params.uid}/message`)
    unreadMessages.value = data?.count || 0
  } catch (error) {
    console.error('Error checking unread messages:', error)
  }
}

// Добавим периодическое обновление сообщений
let messageUpdateInterval: NodeJS.Timeout
let messageCheckInterval: NodeJS.Timeout

onMounted(() => {
  loadMessages()
  checkUnreadMessages()
  
  // Обновляем сообщения каждые 5 секунд
  messageUpdateInterval = setInterval(() => {
    loadMessages()
  }, 5000)
  
  // Проверяем непрочитанные сообщения каждые 30 секунд
  messageCheckInterval = setInterval(() => {
    checkUnreadMessages()
  }, 30000)
})

onUnmounted(() => {
  if (messageCheckInterval) {
    clearInterval(messageCheckInterval)
  }
  if (messageUpdateInterval) {
    clearInterval(messageUpdateInterval)
  }
})
</script>

<style scoped>
.messages-container {
  scrollbar-width: thin;
  scrollbar-color: #d4d4d4 transparent;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background-color: #d4d4d4;
  border-radius: 3px;
}

.dark .messages-container::-webkit-scrollbar-thumb {
  background-color: #404040;
}
</style>
