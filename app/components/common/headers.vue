<template>
  <header 
  class="w-full 
  flex 
  flex-row 
  items-center
  p-4">
    <CommonLogo />
    <UNavigationMenu
      arrow
      :items="translatedItems"
      class="w-full justify-center"
    />

    <UButton data-language-button @click="isLanguageModalOpen = true" variant="outline">
      <UIcon name="i-lucide-globe" />
    </UButton>
    <UButton @click="toggleTheme" class="ml-2" variant="outline">
      <UIcon :name="colorMode === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'" />
    </UButton>
    <SettingsLanguageSelect v-model="isLanguageModalOpen" />
  </header>
</template>

<script setup lang="ts">
import nav from '~/assets/nav.json'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { useColorMode } from '@vueuse/core'

const { t } = useI18n()
const isLanguageModalOpen = ref(false)
const colorMode = useColorMode()
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