<template>
  <div class="fixed bottom-8 right-8 z-50">
    <!-- Feedback Button -->
    <UButton
      icon="i-lucide-message-square-reply"
      :color="buttonColor"
      :variant="buttonVariant"
      size="lg"
      class="rounded-full shadow-lg hover:scale-105 transition-all duration-300"
      @click="isModalOpen = true"
      :aria-label="$t('feedback.leaveFeedback')"
    />

    <!-- Modal -->
    <UModal
      v-model="isModalOpen"
      :ui="{
        overlay: 'bg-gray-900/75 dark:bg-gray-900/75',
        content: 'relative text-left rtl:text-right overflow-hidden my-4 w-full max-w-lg transform transition-all rounded-lg shadow-2xl p-6 bg-white dark:bg-gray-900',
        wrapper: 'flex min-h-screen items-center justify-center text-center'
      }"
    >
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold">{{ $t('feedback.title') }}</h2>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          @click="isModalOpen = false"
        />
      </div>

      <div class="space-y-4">
        <UButton
          to="https://forms.google.com/your-form-link"
          target="_blank"
          block
          variant="soft"
          class="justify-start"
        >
          <template #leading>
            <UIcon name="i-lucide-file-text" />
          </template>
          {{ $t('feedback.fillForm') }}
        </UButton>

        <UButton
          to="mailto:developer@example.com"
          block
          variant="soft"
          class="justify-start"
        >
          <template #leading>
            <UIcon name="i-lucide-mail" />
          </template>
          {{ $t('feedback.writeDeveloper') }}
        </UButton>

        <UButton
          to="/templates/feedback-template.docx"
          download
          block
          variant="soft"
          class="justify-start"
        >
          <template #leading>
            <UIcon name="i-lucide-download" />
          </template>
          {{ $t('feedback.downloadTemplate') }}
        </UButton>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const isModalOpen = ref(false)
const buttonVariant = ref<'outline' | 'solid'>('outline')
const buttonColor = ref<'primary' | 'neutral'>('primary')

// Функция для анимации кнопки
const animateButton = () => {
  buttonVariant.value = buttonVariant.value === 'outline' ? 'solid' : 'outline'
}

// Запускаем анимацию каждые 30 секунд
onMounted(() => {
  setInterval(animateButton, 30000)
})
</script>
