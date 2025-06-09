<template>
  <div class="grid grid-cols-1 gap-3">
    <UButton
      color="neutral"
      variant="soft"
      @click="handleProviderClick('google')"
      :loading="loading"
      class="w-full"
    >
      <template #leading>
        <i class="i-simple-icons-google text-lg" />
      </template>
      {{ $t('common.google') }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'provider', provider: 'google'): void
}>()

const handleProviderClick = (provider: 'google') => {
  emit('provider', provider)
}
</script> 