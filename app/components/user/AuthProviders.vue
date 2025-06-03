<template>
  <div class="grid grid-cols-2 gap-3">
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
    
    <UButton
      color="neutral"
      variant="soft"
      @click="handleProviderClick('anonymous')"
      :loading="loading"
      class="w-full"
    >
      <template #leading>
        <i class="i-heroicons-user text-lg" />
      </template>
      {{ $t('common.continueAsGuest') }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'provider', provider: 'google' | 'anonymous'): void
}>()

const handleProviderClick = (provider: 'google' | 'anonymous') => {
  emit('provider', provider)
}
</script> 