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
            variant="ghost"
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
            variant="ghost"
            class="justify-start"
          >
            <template #leading>
              <UIcon name="i-lucide-mail" />
            </template>
            {{ $t('feedback.writeDeveloper') }}
          </UButton>

          <a
            :href="templateUrl"
            download
            class="flex items-center justify-start w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <UIcon name="i-lucide-download" class="mr-2" />
            {{ $t('feedback.downloadTemplate') }}
          </a>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const isModalOpen = ref(false)
const buttonVariant = ref<'outline' | 'solid'>('solid')
const buttonColor = ref<'primary'>('primary')
const templateUrl = '/template.pdf'
</script>
