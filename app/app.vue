<template>
  <UApp 
  :toast="{
    position: 'top-right',
    duration: 3000,
  }"
  class="
  bg-neutral-900 
  dark:bg-neutral-100 
  text-neutral-100 
  dark:text-neutral-900">
    <NuxtLayout> 
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>


<script setup lang="ts">
const { t } = useI18n()
const i18nHead = useLocaleHead({ seo: true })
const themeHandler = computed(() => (useColorMode().value === 'dark' ? '#0c0c0d' : '#ffffff'))
const { locale } = useI18n()

useHead({
  htmlAttrs: { lang: i18nHead.value.htmlAttrs!.lang },
  link: [...(i18nHead.value.link || [])],
  title: t(`${locale.value}.title`),
  meta: [
    { name: 'theme-color', content: themeHandler.value },
    ...(i18nHead.value.meta || []),
    { name: 'description', content: t('core.desc') },
  ],
})

</script>