<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Панель управления -->
    <div class="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <UButton
              :color="store.showCreate ? 'primary' : 'neutral'"
              variant="soft"
              @click="store.toggleCreate"
            >
              <Icon name="lucide:edit" class="w-5 h-5 mr-2" />
              Создание
            </UButton>
            <UButton
              :color="store.showPreview ? 'primary' : 'neutral'"
              variant="soft"
              @click="store.togglePreview"
            >
              <Icon name="lucide:eye" class="w-5 h-5 mr-2" />
              Превью
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Основной контент -->
    <div class="container mx-auto px-4 py-8">
      <div class="grid gap-6" :class="gridClass">
        <!-- Левая панель -->
        <div v-if="store.leftPanel" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-medium">
              {{ store.leftPanel === 'create' ? 'Создание' : 'Превью' }}
            </h2>
          </div>
          <div class="p-4">
            <PostsCreate 
              v-if="store.leftPanel === 'create'" 
              :model-value="store.draft"
              @update="handleFormUpdate"
            />
            <PostsFull v-else :post="store.draft" :key="previewKey" />
          </div>
        </div>

        <!-- Правая панель -->
        <div v-if="store.rightPanel" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-medium">
              {{ store.rightPanel === 'create' ? 'Создание' : 'Превью' }}
            </h2>
          </div>
          <div class="p-4">
            <PostsCreate 
              v-if="store.rightPanel === 'create'" 
              :model-value="store.draft"
              @update="handleFormUpdate"
            />
            <PostsFull v-else :post="store.draft" :key="previewKey" />
          </div>
        </div>
      </div>
    </div>
    <PostsAiagent />
  </div>
</template>

<script setup lang="ts">
import { useArticleBuilderStore } from '~/stores/articleBuilder'
import PostsCreate from '~/components/posts/create.vue'
import PostsFull from '~/components/posts/full.vue'

const store = useArticleBuilderStore()
const previewKey = ref(0)

// Вычисляем классы для сетки в зависимости от количества панелей
const gridClass = computed(() => {
  if (store.showCreate && store.showPreview) {
    return 'grid-cols-2'
  }
  return 'grid-cols-1'
})

// Обработчик обновления формы
const handleFormUpdate = (newForm: Partial<Post>) => {
  store.updateDraft(newForm)
  previewKey.value++
}
</script>