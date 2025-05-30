<template>
  <header 
    class="w-full 
    flex 
    flex-row 
    items-center
    p-4">
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
      <template v-if="!isAuthenticated">
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
      <UserNav v-else />
    </div>
  </header>
</template>

<script setup lang="ts">
import nav from '~/assets/nav.json'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { useColorMode } from '@vueuse/core'
import { useUserStore } from '~/stores/user'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()
const userStore = useUserStore()
const isLanguageModalOpen = ref(false)
const colorMode = useColorMode()
const showLoginModal = ref(false)
const showRegisterModal = ref(false)
const isAuthenticated = computed(() => userStore.isAuthenticated)

const navItems = computed(() => nav)

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
</script>