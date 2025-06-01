<template>
  <div>
    <h1>Ошибка</h1>
    <p>{{ error?.message || 'Произошла ошибка' }}</p>
  </div>
</template>

<script setup lang="ts">
const error = useError()

// Если ошибка 401, перенаправляем на страницу входа
if (error.value?.statusCode === 401) {
  navigateTo('/login')
}
</script> 