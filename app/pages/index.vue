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
        <UStepper 
        disabled 
          :orientation="isMobile ? 'vertical' : 'horizontal'" 
          :items="stepperItems" 
          class="w-full"
          @next="handleNext"
          @prev="handlePrev"
          @update:modelValue="handleStepChange"
        >
          <template #indicator="{ item }">
            <div 
              class="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/30"
              @click="handleStepClick(item)"
            >
              <Icon 
                :name="item.icon || ''" 
                class="w-5 h-5 text-primary"
              />
            </div>
          </template>

          <template #title="{ item }">
            <div 
              class="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-primary"
              @click="handleStepClick(item)"
            >
              {{ item.title }}
            </div>
          </template>

          <template #description="{ item }">
            <div 
              class="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-primary-500"
              @click="handleStepClick(item)"
            >
              {{ item.description }}
            </div>
          </template>
        </UStepper>
      </div>

      <!-- AI Assistant Section (Call to Action) -->
      <div
        class="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer transition hover:shadow-xl hover:bg-primary-50 dark:hover:bg-primary-900/20"
        @click="navigateTo('/article-builder')"
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

const stepperItems = computed<StepperItem[]>(() => [
  {
    title: t('index.stepper.register.title'),
    description: t('index.stepper.register.description'),
    icon: 'i-lucide-user-plus',
    status: userStore.isAuthenticated ? 'complete' : 'current'
  },
  {
    title: t('index.stepper.profile.title'),
    description: t('index.stepper.profile.description'),
    icon: 'i-lucide-user',
    status: userStore.isAuthenticated ? 'complete' : 'upcoming'
  },
  {
    title: t('index.stepper.explore.title'),
    description: t('index.stepper.explore.description'),
    icon: 'i-lucide-search',
    status: userStore.isAuthenticated ? 'complete' : 'upcoming'
  },
  {
    title: t('index.stepper.create.title'),
    description: t('index.stepper.create.description'),
    icon: 'i-lucide-lightbulb',
    status: userStore.isAuthenticated ? 'current' : 'upcoming'
  }
])

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

const handleNext = (item: StepperItem) => {
  console.log('Next step:', item)
  if (item.title === t('index.stepper.register.title')) {
    authStore.openRegister()
  }
}

const handlePrev = (item: StepperItem) => {
  console.log('Previous step:', item)
}

const handleStepChange = (value: string | number | undefined) => {
  console.log('Step changed to:', value)
  currentStep.value = typeof value === 'number' ? value : 0
}

const handleStepClick = (item: StepperItem) => {
  const stepIndex = stepperItems.value.findIndex(step => step.title === item.title)
  
  if (stepIndex === 0) {
    // Если это первый шаг (регистрация)
    if (!userStore.isAuthenticated) {
      authStore.openRegister()
    }
  } else if (stepIndex === 1) {
    // Если это второй шаг (профиль)
    if (userStore.isAuthenticated) {
      router.push(`/user/${userStore.user?.id}/profile`)
    } else {
      authStore.openLogin()
    }
  } else if (stepIndex === 2) {
    // Если это третий шаг (explore)
    router.push('/ideas')
  } else if (stepIndex === 3) {
    // Если это четвертый шаг (create)
    router.push('/article-builder')
  } else if (stepIndex === currentStep.value) {
    // Если кликаем на текущий шаг
    if (stepIndex === 0 && !userStore.isAuthenticated) {
      authStore.openRegister()
    } else if (stepIndex === 1 && userStore.isAuthenticated) {
      router.push(`/user/${userStore.user?.id}/profile`)
    } else if (stepIndex === 2) {
      router.push('/ideas')
    } else if (stepIndex === 3) {
      router.push('/article-builder')
    }
  } else {
    // Если кликаем на другой шаг
    currentStep.value = stepIndex
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
</script>
