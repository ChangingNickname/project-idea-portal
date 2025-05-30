<template>
  <div class="p-4">
    <div v-if="pending" class="text-center">
      Loading...
    </div>
    <div v-else-if="error" class="text-red-500">
      Error: {{ error?.message || 'Unknown error' }}
    </div>
    <pre v-else class="bg-gray-100 p-4 rounded-lg overflow-auto">{{ JSON.stringify(userData, null, 2) }}</pre>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const uid = route.params.uid as string
const userData = ref<any>(null)
const error = ref<Error | null>(null)
const pending = ref(true)

try {
  userData.value = await $fetch(`/api/user/profile/${uid}`)
} catch (e) {
  error.value = e as Error
  console.error('Error fetching user data:', e)
} finally {
  pending.value = false
}
</script>

<style scoped>
pre {
  max-height: 80vh;
}
</style>
