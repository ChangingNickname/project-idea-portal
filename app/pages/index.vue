<template>
  <div class="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
    <!-- Hero Section -->
    <div class="container mx-auto px-4 py-16">
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-6xl font-bold mb-4">
          <span class="text-primary">{{ $t('index.title1') }}</span>
          <br />
          {{ $t('index.title2') }}
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
          {{ $t('index.subtitle') }}
        </p>
      </div>

      <!-- Search Section -->
      <div class="max-w-2xl mx-auto mb-16">
        <div class="relative">
          <UInput
            v-model="searchQuery"
            :placeholder="$t('common.search')"
            icon="i-heroicons-magnifying-glass"
            size="xl"
            class="w-full"
            @keyup.enter="handleSearch"
          />
          <UButton
            color="primary"
            size="xl"
            class="absolute right-0 top-1/2 -translate-y-1/2"
            @click="handleSearch"
          >
            {{ $t('common.search') }}
          </UButton>
        </div>
      </div>

      <!-- Stepper Section -->
      <div class="max-w-3xl mx-auto mb-16">
        <div class="relative">
          <div class="absolute left-0 right-0 top-[40%] h-0.5 bg-gray-200 dark:bg-gray-700 z-0"/>
          <div class="grid grid-cols-4 gap-4 relative z-10">
            <div class="flex flex-col items-center">
              <UButton
                icon="i-lucide-user-plus"
                size="xl"
                :color="userStore.isAuthenticated ? 'success' : 'primary'"
                :disabled="userStore.isAuthenticated"
                variant="solid"
                class="rounded-full shadow-none w-24 h-24 flex items-center justify-center"
                :class="userStore.isAuthenticated ? 'opacity-50' : ''"
                @click="handleRegister"
              />
              <div class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                {{ $t('index.stepper.register.title') }}
              </div>
            </div>
            <div class="flex flex-col items-center">
              <UButton
                icon="i-lucide-user"
                size="xl"
                :color="getProfileButtonColor"
                :disabled="!userStore.isAuthenticated"
                variant="solid"
                class="rounded-full shadow-none w-24 h-24 flex items-center justify-center"
                :class="!userStore.isAuthenticated ? 'opacity-50' : ''"
                @click="handleProfile"
              />
              <div class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                {{ $t('index.stepper.profile.title') }}
              </div>
            </div>
            <div class="flex flex-col items-center">
              <UButton
                icon="i-lucide-search"
                size="xl"
                :color="getExploreButtonColor"
                :disabled="!isProfileComplete"
                variant="solid"
                class="rounded-full shadow-none w-24 h-24 flex items-center justify-center"
                :class="!isProfileComplete ? 'opacity-50' : ''"
                @click="handleExplore"
              />
              <div class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                {{ $t('index.stepper.explore.title') }}
              </div>
            </div>
            <div class="flex flex-col items-center">
              <UButton
                icon="i-lucide-lightbulb"
                size="xl"
                :color="getCreateButtonColor"
                :disabled="!isProfileComplete"
                variant="solid"
                class="rounded-full shadow-none w-24 h-24 flex items-center justify-center"
                :class="!isProfileComplete ? 'opacity-50' : ''"
                @click="handleArticleBuilderClick"
              />
              <div class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                {{ $t('index.stepper.create.title') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Assistant Section (Call to Action) -->
      <div
        class="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer transition hover:shadow-xl hover:bg-primary-50 dark:hover:bg-primary-900/20"
        @click="handleArticleBuilderClick"
        tabindex="0"
        role="button"
        aria-label="{{ $t('index.button2') }}"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-semibold flex items-center">
            <Icon name="lucide:message-square" class="w-6 h-6 mr-2 text-primary" />
            {{ $t('index.button1') }}
            <span class="text-primary ml-1">{{ $t('index.button2') }}</span>
          </h2>
        </div>
        <p class="text-gray-600 dark:text-gray-300">
          {{ $t('core.desc') }}
        </p>
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useRouter, useRoute } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const searchQuery = ref('')
const isMobile = ref(false)
const authStore = useAuthStore()
const userStore = useUserStore()
const currentStep = ref(3) // Сразу устанавливаем последний шаг

// Отслеживаем состояние авторизации через computed
const isAuthenticated = computed(() => userStore.isAuthenticated)

// Computed properties for button states
const isProfileComplete = computed(() => {
  if (!userStore.user) return false
  return !!(
    userStore.user.displayName &&
    userStore.user.position
  )
})

const getProfileButtonColor = computed(() => {
  if (!userStore.isAuthenticated) return 'neutral'
  return isProfileComplete.value ? 'success' : 'primary'
})

const getExploreButtonColor = computed(() => {
  if (!isProfileComplete.value) return 'neutral'
  return 'primary'
})

const getCreateButtonColor = computed(() => {
  if (!isProfileComplete.value) return 'neutral'
  return 'primary'
})

// Определяем размер экрана при монтировании и при изменении размера окна
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768 // md breakpoint в Tailwind
}

// Button handlers
const handleRegister = () => {
  if (!userStore.isAuthenticated) {
    authStore.openRegister()
  }
}

const handleProfile = () => {
    if (userStore.isAuthenticated) {
      router.push(`/user/${userStore.user?.id}/profile`)
  }
    }

const handleExplore = () => {
  if (isProfileComplete.value) {
    router.push('/ideas')
  }
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    navigateTo({
      path: '/ideas',
      query: { search: searchQuery.value }
    })
  } else {
    navigateTo('/ideas')
  }
}

const handleArticleBuilderClick = () => {
  if (userStore.isAuthenticated) {
    navigateTo('/article-builder')
  } else {
    authStore.openLogin()
  }
}
</script>
