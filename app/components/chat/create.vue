<template>
  <div class="p-4 border-t dark:border-neutral-800">
    <form @submit.prevent="sendMessage" class="flex gap-2">
      <UTextarea
        v-model="message"
        :placeholder="t('common.typeMessage')"
        class="flex-1"
        :rows="1"
        :auto-rows="true"
        @keydown="handleKeyDown"
      >
        <template #trailing>
          <UButton
            type="submit"
            color="primary"
            variant="ghost"
            :disabled="!message.trim()"
          >
            <Icon name="lucide:send" class="w-5 h-5" />
          </UButton>
        </template>
      </UTextarea>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  userId: string
}>()

const emit = defineEmits<{
  (e: 'messageSent', message: Message): void
}>()

const { t } = useI18n()
const message = ref('')

const handleKeyDown = (event: KeyboardEvent) => {
  // Если нажат Ctrl+Enter, отправляем сообщение
  if (event.key === 'Enter' && event.ctrlKey) {
    event.preventDefault()
    sendMessage()
  }
}

const sendMessage = async () => {
  if (!message.value.trim()) return

  // Создаем временное сообщение со статусом "sending"
  const tempMessage: Message = {
    id: 'temp-' + Date.now(),
    from_user_id: '',
    to_user_id: props.userId,
    message: message.value,
    type: 'text',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    read_at: null,
    read_by: [],
    status: 'sending',
    timestamp: Date.now()
  }

  // Эмитим временное сообщение
  emit('messageSent', tempMessage)
  const messageText = message.value
  message.value = ''

  try {
    const newMessage = await $fetch<Message>(`/api/user/${props.userId}/message`, {
      method: 'POST',
      body: {
        message: messageText,
        type: 'text'
      }
    })

    if (newMessage) {
      // Обновляем сообщение со статусом "sent"
      emit('messageSent', {
        ...newMessage,
        read_by: [],
        status: 'sent'
      })
    }
  } catch (error) {
    console.error('Error sending message:', error)
    // В случае ошибки эмитим сообщение со статусом "error"
    emit('messageSent', {
      ...tempMessage,
      status: 'error'
    })
  }
}
</script>

<style scoped>
:deep(.u-textarea) {
  min-height: 40px;
  max-height: 200px;
  resize: none;
}
</style>
