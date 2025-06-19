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
            {{ user?.displayName || user?.email || t('common.chat.noEmail') }}
          </h1>
          <p v-if="user?.email && user?.displayName" class="text-sm text-gray-500 dark:text-gray-400">
            {{ user?.email }}
          </p>
        </div>
      </div>
    </div>

    <!-- Сообщения -->
    <div 
      class="flex-1 overflow-y-auto p-4 space-y-4 relative" 
      ref="messagesContainer"
      @scroll="handleScroll"
    >
      <div v-for="message in messages" :key="message.id">
        <ChatMessage
          v-if="message.id && message.message"
          :id="message.id"
          :user="message.from_user_id === currentUser?.id ? currentUser! : user!"
          :message="message.message"
          :timestamp="message.timestamp || new Date(message.created_at).getTime()"
          :status="message.status"
          :readBy="message.read_by"
          :showUserInfo="shouldShowUserInfo(message)"
          :isCurrentUser="message.from_user_id === currentUser?.id"
          :type="message.type"
          :metadata="message.metadata"
          @markAsRead="markMessageAsRead"
          @joinRequestResponse="handleJoinRequestResponse"
        />
      </div>

      <!-- Кнопка прокрутки вниз -->
      <UButton
        v-if="!isNearBottom"
        icon="i-lucide-arrow-down"
        color="primary"
        variant="soft"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        :title="t('common.chat.scrollToBottom')"
        @click="scrollToBottom"
      />
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
import { useUnreadMessagesStore } from '~/stores/unreadMessages'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()
const userStore = useUserStore()
const currentUser = userStore.user
const unreadStore = useUnreadMessagesStore()

// Состояние
const messages = ref<Message[]>([])
const messagesContainer = ref<HTMLElement | null>(null)
const user = ref<User | null>(null)
const unreadMessages = ref<number>(0)

// Добавим состояние для отслеживания, находимся ли мы внизу
const isNearBottom = ref(true)

// Получаем данные пользователя
const userData = await $fetch<User>(`/api/user/${route.params.uid}/profile`)
user.value = userData || null

// Загрузка сообщений
const loadMessages = async () => {
  if (!route.params.uid || !currentUser?.id) return

  try {
    const data = await $fetch<Message[]>(`/api/user/${route.params.uid}/messages`)
    if (data) {
      const oldMessages = messages.value
      messages.value = data.map(msg => ({
        ...msg,
        status: msg.status || 'sent',
        read_by: msg.read_by || [],
        timestamp: msg.timestamp || new Date(msg.created_at).getTime()
      }))

      // Отмечаем непрочитанные сообщения как прочитанные
      const unreadMessages = messages.value.filter(msg => 
        msg.from_user_id === route.params.uid && 
        msg.to_user_id === currentUser.id && 
        !msg.read_at
      )

      if (unreadMessages.length > 0) {
        const firstUnread = unreadMessages[0]
        if (firstUnread?.id) {
          await markMessageAsRead(firstUnread.id)
        }
      }

      // Обновляем store непрочитанных сообщений после загрузки
      await unreadStore.checkUnreadMessages()

      // Прокручиваем только если это первая загрузка или мы были внизу
      if (!oldMessages.length || isNearBottom.value) {
        await nextTick()
        scrollToBottom()
      }
    }
  } catch (error) {
    console.error(t('common.chat.error.loadingMessages'), error)
  }
}

// Обработка отправленного сообщения
const handleMessageSent = async (message: Message) => {
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

  // Обновляем store непрочитанных сообщений после отправки
  await unreadStore.checkUnreadMessages()

  nextTick(() => {
    scrollToBottom()
  })
}

// Отметка сообщений как прочитанных
const markMessageAsRead = async (messageId: string) => {
  if (!route.params.uid || !currentUser?.id) return

  try {
    const result = await $fetch<{ updated: number }>(`/api/user/${route.params.uid}/message`, {
      method: 'PUT',
      body: {
        messageIds: [messageId]
      }
    })

    if (result.updated > 0) {
      // Обновляем статус сообщения локально
      const messageIndex = messages.value.findIndex(m => m.id === messageId)
      if (messageIndex !== -1) {
        const message = messages.value[messageIndex]
        if (message) {
          const read_by = message.read_by || []
          if (!read_by.some(reader => reader.userId === currentUser.id)) {
            read_by.push({
              userId: currentUser.id,
              timestamp: Date.now()
            })
          }

          const updatedMessage: Message = {
            ...message,
            status: 'read',
            read_by,
            read_at: new Date().toISOString()
          }

          messages.value = [
            ...messages.value.slice(0, messageIndex),
            updatedMessage,
            ...messages.value.slice(messageIndex + 1)
          ]

          // Обновляем store непрочитанных сообщений
          await unreadStore.checkUnreadMessages()
        }
      }
    }
  } catch (error) {
    console.error(t('common.chat.error.markingAsRead'), error)
  }
}

// Обновим функцию прокрутки
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    isNearBottom.value = true
  }
}

// Добавим обработчик прокрутки
const handleScroll = () => {
  if (!messagesContainer.value) return

  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  // Считаем, что мы внизу, если до конца осталось меньше 100px
  isNearBottom.value = scrollHeight - scrollTop - clientHeight < 100
}

// Проверка непрочитанных сообщений
const checkUnreadMessages = async () => {
  if (!route.params.uid) return

  try {
    const data = await $fetch<{ count: number }>(`/api/user/${route.params.uid}/message`)
    unreadMessages.value = data?.count || 0
  } catch (error) {
    console.error(t('common.chat.error.checkingUnread'), error)
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

// Добавим функцию для определения, нужно ли показывать информацию о пользователе
const shouldShowUserInfo = (message: Message) => {
  if (!messages.value) return true
  
  const messageIndex = messages.value.findIndex(m => m.id === message.id)
  if (messageIndex === 0) return true
  
  const previousMessage = messages.value[messageIndex - 1]
  return !previousMessage || previousMessage.from_user_id !== message.from_user_id
}

// Добавляем обработчик ответа на запрос о присоединении
const handleJoinRequestResponse = async ({ accepted, postId, userId }: { accepted: boolean, postId: string, userId: string }) => {
  console.log('handleJoinRequestResponse called with:', { accepted, postId, userId })
  
  try {
    // Обновляем пост, добавляя пользователя в участники
    if (accepted) {
      console.log('Adding user to participants:', userId)
      await $fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        body: {
          currentParticipants: [userId]
        }
      } as any)
      console.log('User added to participants successfully')
    }

    // Отправляем сообщение об ответе
    const responseMessage = accepted 
      ? `Вы приняты в проект!`
      : `Ваш запрос на присоединение к проекту отклонен.`

    await $fetch(`/api/user/${userId}/message`, {
      method: 'POST',
      body: {
        message: responseMessage,
        type: 'join_response',
        metadata: {
          postId,
          accepted
        }
      }
    })

    // Перезагружаем сообщения для обновления UI
    await loadMessages()
  } catch (error) {
    console.error('Error handling join request response:', error)
  }
}
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
