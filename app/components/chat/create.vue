<template>
  <div class="p-4 border-t dark:border-neutral-800">
    <form @submit.prevent="sendMessage" class="flex gap-2">
      <UTextarea
        v-model="message"
        :placeholder="t('common.typeMessage')"
        class="flex-1"
        :rows="6"
        :auto-rows="false"
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
  // Если нажат Enter без Shift, отправляем сообщение
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
  // Если нажат Shift+Enter, добавляем новую строку (стандартное поведение)
}

const sendMessage = async () => {
  if (!message.value.trim()) return

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
  }
}
</script>

<style scoped>
:deep(.u-textarea) {
  min-height: 120px; /* Примерно 6 строк */
  max-height: 120px;
  resize: none;
}
</style>
