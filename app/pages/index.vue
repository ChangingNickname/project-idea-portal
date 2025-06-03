<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
    <!-- Hero Section -->
    <div class="container mx-auto px-4 py-16">
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-6xl font-bold mb-4">
          <span class="text-primary">{{ $t('index.title1') }}</span>
          <br />
          {{ $t('index.title2') }}
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
          {{ $t('index.subtitle') }}
        </p>
      </div>

      <!-- Search Section -->
      <div class="max-w-2xl mx-auto mb-16">
        <div class="relative">
          <UInput
            v-model="searchQuery"
            :placeholder="$t('common.search')"
            icon="i-heroicons-magnifying-glass"
            size="xl"
            class="w-full"
            @keyup.enter="handleSearch"
          />
          <UButton
            color="primary"
            size="xl"
            class="absolute right-2 top-1/2 -translate-y-1/2"
            @click="handleSearch"
          >
            {{ $t('common.search') }}
          </UButton>
        </div>
      </div>

      <!-- AI Assistant Section (Call to Action) -->
      <div
        class="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer transition hover:shadow-xl hover:bg-primary-50 dark:hover:bg-primary-900/20"
        @click="navigateTo('/article-builder')"
        tabindex="0"
        role="button"
        aria-label="{{ $t('index.button2') }}"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-semibold flex items-center">
            <Icon name="lucide:message-square" class="w-6 h-6 mr-2 text-primary" />
            {{ $t('index.button1') }}
            <span class="text-primary ml-1">{{ $t('index.button2') }}</span>
          </h2>
        </div>
        <p class="text-gray-600 dark:text-gray-300">
          {{ $t('core.desc') }}
        </p>
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
const searchQuery = ref('')

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    navigateTo({
      path: '/ideas',
      query: { search: searchQuery.value }
    })
  } else {
    navigateTo('/ideas')
  }
}
</script>
