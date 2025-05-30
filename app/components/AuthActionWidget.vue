<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-x-full opacity-0"
      enter-to-class="transform translate-x-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-x-0 opacity-100"
      leave-to-class="transform translate-x-full opacity-0"
    >
      <div v-if="!userStore.isAuthenticated && showWidget" 
           class="fixed bottom-4 right-4 z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm border border-gray-200 dark:border-gray-700 relative">
          <button 
            @click="closeWidget"
            class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <Icon name="heroicons:x-mark" class="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </button>
          <div class="flex flex-col gap-2">
            <h3 class="text-lg font-semibold text-center">
              {{ t('index.title1') }}
              <span class="text-primary"> {{ t('index.title2') }} </span>
            </h3>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 text-center">
              {{ t('index.subtitle') }}
            </p>
            <UButton color="primary" variant="outline" class="w-full">
              <span> {{ t('index.button1') }} </span>
              <span class="underline text-primary"> {{ t('index.button2') }} </span>
            </UButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import { ref, onMounted } from 'vue'

const { t } = useI18n()
const userStore = useUserStore()
const showWidget = ref(false)

const closeWidget = () => {
  showWidget.value = false
  // Store the closed state in localStorage to prevent showing again
  localStorage.setItem('authWidgetClosed', 'true')
}

onMounted(() => {
  // Check if widget was previously closed
  const wasClosed = localStorage.getItem('authWidgetClosed')
  if (!wasClosed) {
    // Show widget after 1 minute
    setTimeout(() => {
      showWidget.value = true
    }, 60000)
  }
})
</script> 