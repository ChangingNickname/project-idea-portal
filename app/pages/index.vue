<template>
  <div class="h-screen max-h-128 w-full flex flex-col items-center justify-center gap-4">
    <h1 class="text-4xl font-bold text-center">
      {{ t('index.title1') }}
      <span class="text-primary"> {{ t('index.title2') }} </span>
    </h1>
    <h2 class="text-lg text-center">
      {{ t('index.subtitle') }}
    </h2>
    <UButton color="primary" variant="outline" class="text-2xl">
      <span> {{ t('index.button1') }} </span>
      <span class="underline text-primary"> {{ t('index.button2') }} </span>
    </UButton>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>