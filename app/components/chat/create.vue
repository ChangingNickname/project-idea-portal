<template>
  <div class="p-4 border-t dark:border-neutral-800">
    <form @submit.prevent="sendMessage" class="flex gap-2">
      <UTextarea
        v-model="message"
        :placeholder="t('common.typeMessage')"
        class="flex-1"
        :rows="3"
        :auto-rows="false"
        @keydown="handleKeyDown"
      >
        <template #trailing>
          <UButton
            type="submit"
            color="primary"
            variant="ghost"
            :disabled="!message.trim() || isSending"
            :loading="isSending"
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
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'messageSent', message: Message): void
}>()

const { t } = useI18n()
const message = ref('')
const isSending = ref(false)

const handleKeyDown = (event: KeyboardEvent) => {
  // Если нажат Enter без Shift, отправляем сообщение
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
  // Если нажат Shift+Enter, добавляем новую строку (стандартное поведение)
}

const sendMessage = async () => {
  if (!message.value.trim() || isSending.value || props.disabled) return

  const messageText = message.value
  message.value = ''
  isSending.value = true

  try {
    const newMessage = await $fetch<Message>(`/api/user/${props.userId}/message`, {
      method: 'POST',
      body: {
        message: messageText,
        type: 'text'
      }
    })

    if (newMessage) {
      // Эмитим сообщение только один раз после успешной отправки
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
      id: 'temp-' + Date.now(),
      from_user_id: '',
      to_user_id: props.userId,
      message: messageText,
      type: 'text',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      read_at: null,
      read_by: [],
      status: 'error',
      timestamp: Date.now()
    })
  } finally {
    isSending.value = false
  }
}
</script>

<style scoped>
:deep(.u-textarea) {
  min-height: 80px; /* Примерно 3 строки */
  max-height: 80px;
  resize: none;
}

/* Улучшаем отзывчивость в мобильных устройствах */
@media (max-width: 768px) {
  :deep(.u-textarea) {
    min-height: 60px; /* Меньше высота на мобильных */
    max-height: 60px;
  }
}
</style>
