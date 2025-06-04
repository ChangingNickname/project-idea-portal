<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b">
      <h2 class="text-xl font-semibold">{{ $t('aiAgent.title') }}</h2>
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
        <UButton
          v-if="messages.length > 0"
          color="neutral"
          variant="ghost"
          icon="i-heroicons-trash"
          @click="handleClearSession"
          :title="$t('aiAgent.clearHistory')"
        />
      </div>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto">
      <div class="space-y-4">
        <ChatMessage
          v-for="(message, index) in messages"
          :key="index"
          :message="message.content"
          :timestamp="new Date(message.timestamp).getTime()"
          :user="{
            id: message.role,
            email: message.role === 'user' ? userEmail : 'ai@assistant.com',
            avatar: message.role === 'user' ? userAvatar : '/images/ai-avatar.png',
            emailVerified: true,
            displayName: message.role === 'user' ? $t('aiAgent.user') : $t('aiAgent.assistant'),
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
            }
          }"
          :is-current-user="message.role === 'user'"
          :status="message.role === 'user' ? 'sent' : 'delivered'"
          :show-user-info="true"
        >
          <template #avatar>
            <Avatar
              :src="message.role === 'user' ? userAvatar : '/images/ai-avatar.png'"
              :email="message.role === 'user' ? userEmail : 'ai@assistant.com'"
              :alt="message.role === 'user' ? $t('aiAgent.user') : $t('aiAgent.assistant')"
              size="sm"
            />
          </template>
        </ChatMessage>
      </div>
    </div>

    <!-- Input -->
    <ChatCreate
      :user-id="'assistant'"
      @message-sent="handleMessageSent"
    />
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

const messages = computed(() => aiAgentStore.messages)
const userEmail = computed(() => userStore.user?.email || '')
const userAvatar = computed(() => userStore.user?.avatar || '')

const handleMessageSent = async (message: any) => {
  try {
    await aiAgentStore.sendMessage(message.message)
  } catch (error) {
    useToast().add({
      title: t('common.error'),
      description: t('aiAgent.messageError'),
      color: 'error'
    })
  }
}

const handleClearSession = () => {
  aiAgentStore.clearSession()
}

const handleReset = async () => {
  try {
    isResetting.value = true
    await aiAgentStore.generateToken()
    aiAgentStore.clearSession()
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