<template>
  <AuthActionWidget />
</template>

<script setup lang="ts">
import AuthActionWidget from '~/components/AuthActionWidget.vue'
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>