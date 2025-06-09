<template>
  <div class="fixed bottom-8 right-8 z-50">
    <UModal>
      <UButton
        :color="buttonColor"
        :variant="buttonVariant"
        size="lg"
        class="rounded-full shadow-lg hover:scale-105 transition-all duration-300"
        :aria-label="$t('feedback.leaveFeedback')"
      >
        <template #leading>
          <UIcon name="i-lucide-message-square-reply" />
        </template>
        {{ $t('feedback.leaveFeedback') }}
      </UButton>

      <!-- Контент модального окна -->
      <template #content>
        <div class="space-y-4 p-4">
          <UButton
            to="https://forms.gle/B7bYHcuSakqbzpyf7"
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
            :to="templateUrl"
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
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const isModalOpen = ref(false)
const buttonVariant = ref<'outline' | 'solid'>('outline')
const buttonColor = ref<'primary'>('primary')
const templateUrl = '/assets/templates/feedback-template.docx'

const animateButton = () => {
  buttonVariant.value = buttonVariant.value === 'outline' ? 'solid' : 'outline'
}
onMounted(() => {
  setInterval(animateButton, 2000)
})
</script>
