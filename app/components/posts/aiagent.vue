<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b">
      <div class="flex items-center gap-2">
        <UButton
          v-if="messages.length > 0"
          color="neutral"
          variant="ghost"
          icon="i-heroicons-arrow-path"
          :loading="isResetting"
          @click="handleReset"
          :title="$t('aiAgent.resetChat')"
        />
      </div>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <div class="space-y-4 p-4">
        <ChatMessage
          v-for="(message, index) in messages"
          :key="index"
          :message="message.content"
          :timestamp="new Date(message.timestamp).getTime()"
          :user="{
            id: message.user?.id || message.role,
            email: message.user?.email || (message.role === 'user' ? userEmail : 'ai@assistant.com'),
            avatar: message.user?.avatar || (message.role === 'user' ? userAvatar : '/images/ai-avatar.png'),
            emailVerified: true,
            displayName: message.user?.displayName || (message.role === 'user' ? $t('aiAgent.user') : $t('aiAgent.assistant')),
            disabled: false,
            isAnonymous: false,
            providerData: [],
            customClaims: null,
            metadata: {
              creationTime: new Date().toISOString(),
              lastSignInTime: new Date().toISOString()
            },
            tenantId: null,
            multiFactor: null,
            contacts: {
              email: null,
              phone: null,
              telegram: null,
              whatsapp: null,
              viber: null,
              discord: null,
              linkedin: null,
              github: null,
              website: null
            },
            position: ''
          }"
          :is-current-user="message.role === 'user'"
          :status="message.role === 'user' ? 'sent' : 'delivered'"
          :show-user-info="true"
        >
          <template #avatar>
            <Avatar
              :src="message.user?.avatar || (message.role === 'user' ? userAvatar : '/images/ai-avatar.png')"
              :email="message.user?.email || (message.role === 'user' ? userEmail : 'ai@assistant.com')"
              :alt="message.user?.displayName || (message.role === 'user' ? $t('aiAgent.user') : $t('aiAgent.assistant'))"
              size="sm"
            />
          </template>
        </ChatMessage>
      </div>
    </div>

    <!-- Input -->
    <div class="border-t">
      <ChatCreate
        :user-id="'assistant'"
        :disabled="isSending || aiAgentStore.isProcessing"
        @message-sent="handleMessageSent"
        class="h-[200px] resize-none"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAiAgentStore } from '~/stores/aiagent'
import { useI18n } from 'vue-i18n'
import ChatMessage from '~/components/chat/message.vue'
import ChatCreate from '~/components/chat/create.vue'
import Avatar from '~/components/user/Avatar.vue'
import { useUserStore } from '~/stores/user'

const { t } = useI18n()
const aiAgentStore = useAiAgentStore()
const userStore = useUserStore()
const isResetting = ref(false)
const isSending = ref(false)

const messages = computed(() => aiAgentStore.messages)
const userEmail = computed(() => userStore.user?.email || '')
const userAvatar = computed(() => userStore.user?.avatar || '')

const getWelcomeMessage = () => ({
  role: 'assistant' as const,
  content: t('aiAgent.welcomeMessage'),
  timestamp: new Date().toISOString(),
  user: {
    id: 'assistant',
    email: 'ai@assistant.com',
    avatar: '/images/ai-avatar.png',
    displayName: 'AI Assistant'
  }
})

// Инициализация приветственного сообщения при монтировании
onMounted(() => {
  if (messages.value.length === 0) {
    aiAgentStore.setWelcomeMessage(getWelcomeMessage())
  }
})

const handleMessageSent = async (message: any) => {
  console.log('handleMessageSent triggered with:', message)
  
  if (isSending.value) {
    console.log('Message is already being sent, skipping')
    return
  }
  
  if (!message?.message) {
    console.log('Invalid message format, skipping')
    return
  }
  
  try {
    isSending.value = true
    console.log('Starting message send:', message.message)
    await aiAgentStore.sendMessage(message.message)
  } catch (error) {
    console.error('Error sending message:', error)
    useToast().add({
      title: t('common.error'),
      description: t('aiAgent.messageError'),
      color: 'error'
    })
  } finally {
    isSending.value = false
  }
}

const handleReset = async () => {
  try {
    isResetting.value = true
    await aiAgentStore.generateToken()
    aiAgentStore.clearSession()
    aiAgentStore.setWelcomeMessage(getWelcomeMessage())
    useToast().add({
      title: t('common.success'),
      description: t('aiAgent.chatReset'),
      color: 'success'
    })
  } catch (error) {
    useToast().add({
      title: t('common.error'),
      description: t('aiAgent.resetError'),
      color: 'error'
    })
  } finally {
    isResetting.value = false
  }
}
</script>