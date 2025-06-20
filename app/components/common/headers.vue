<template>
  <header 
    class="w-full 
    flex 
    flex-col 
    items-center
    p-4">
    <div class="w-full flex flex-row items-center justify-between">
      <NuxtLink to="/">
        <CommonLogo />
      </NuxtLink>

      <div class="flex-1 flex justify-center gap-4">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          :class="[
            isActiveRoute(item.to) 
              ? 'text-primary-500 bg-primary-50 dark:bg-primary-950' 
              : 'text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400'
          ]"
        >
          <UIcon :name="item.icon" />
          {{ t(item.label) }}
        </NuxtLink>
      </div>

      <div class="flex flex-row gap-2">
        <ClientOnly>
          <template v-if="!isAuthenticated && !userStore.loading">
            <UButton 
              data-language-button 
              @click="isLanguageModalOpen = true" 
              size="lg" 
              variant="ghost"
            >
              <UIcon name="i-lucide-globe" />
            </UButton>
            <UButton 
              @click="toggleTheme" 
              size="lg" 
              variant="ghost"
            >
              <ClientOnly>
                <template #default>
                  <UIcon :name="colorMode === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'" />
                </template>
                <template #fallback>
                  <UIcon name="i-lucide-moon" />
                </template>
              </ClientOnly>
            </UButton>
            <UButton 
              size="lg" 
              variant="solid" 
              color="primary"
              :label="$t('common.register')" 
              @click="openRegister"
            />
            <UButton 
              size="lg" 
              variant="solid" 
              color="primary"
              :label="$t('common.signIn')" 
              @click="openLogin"
            />

            <UserLogin
              v-model="showLoginModal"
              @open-register="openRegister"
            />
            <UserRegister
              v-model="showRegisterModal"
              @open-login="openLogin"
            />
            <SettingsLanguageSelect v-model="isLanguageModalOpen" />
          </template>
          <template v-else-if="userStore.loading">
            <USkeleton class="h-10 w-24" />
          </template>
          <UserNav v-else />
        </ClientOnly>
      </div>
    </div>
    <div class="w-full mt-2">
      <UNavigationMenu :items="items" class="w-full justify-center" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useColorMode } from '@vueuse/core'
import { useUserStore } from '~/stores/user'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { subjectAreas } from '~/utils/subjectAreas'

interface NavItem {
  to: string
  icon: string
  label: string
}

const { t } = useI18n()
const route = useRoute()
const userStore = useUserStore()
const isLanguageModalOpen = ref(false)
const colorMode = useColorMode()
const showLoginModal = ref(false)
const showRegisterModal = ref(false)
const screenWidth = ref(window.innerWidth)

// Watch for authentication state changes
const isAuthenticated = computed(() => {
  return userStore.isAuthenticated
})

// Close modals when authentication state changes
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    showLoginModal.value = false
    showRegisterModal.value = false
  }
})

const items = computed(() => [
  ...subjectAreas.map(area => ({
    label: screenWidth.value < 640 ? '' : t(area.i18nKey),
    icon: area.icon,
    to: `/ideas?subjectAreas=${area.children?.map(child => child.key).join(',') || area.key}`,
    children: area.children?.map(child => ({
      label: screenWidth.value < 640 ? '' : t(child.i18nKey),
      icon: area.icon,
      to: `/ideas?subjectAreas=${child.key}`
    }))
  }))
])

const navItems = computed<NavItem[]>(() => [
])

const isActiveRoute = (path: string) => {
  return route.path.startsWith(path)
}

const toggleTheme = () => {
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
}

const openLogin = () => {
  showRegisterModal.value = false
  setTimeout(() => {
    showLoginModal.value = true
  }, 150)
}

const openRegister = () => {
  showLoginModal.value = false
  setTimeout(() => {
    showRegisterModal.value = true
  }, 150)
}

// Add window resize listener
onMounted(() => {
  window.addEventListener('resize', () => {
    screenWidth.value = window.innerWidth
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {})
})
</script>