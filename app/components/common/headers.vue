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
    <UNavigationMenu
      arrow
      :items="translatedItems"
      class="w-full justify-center"
    />

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
          <UIcon :name="colorMode === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'" />
        </UButton>
        <UButton 
          size="lg" 
          variant="solid" 
          :label="$t('common.signIn')" 
          @click="isOpen = true"
        />

        <UserLogin
          v-model="isOpen"
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

const { t } = useI18n()
const userStore = useUserStore()
const isLanguageModalOpen = ref(false)
const colorMode = useColorMode()
const isOpen = ref(false)
const isAuthenticated = computed(() => userStore.isAuthenticated)

const toggleTheme = () => {
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
}

const translatedItems = computed(() =>
  nav.map(item => ({
    ...item,
    label: t(item.label)
  }))
)
</script>