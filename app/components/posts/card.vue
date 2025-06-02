<template>
  <div v-if="post">
    <div 
      data-post-card
      :class="[
        'bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden',
        props.isFull ? 'cursor-default' : 'cursor-pointer w-128 h-128'
      ]"
      @click="!props.isFull && (isModalOpen = true)"
    >
      <!-- Обложка -->
      <div :class="[
        'relative w-full',
        props.isFull ? 'h-64' : 'h-64'
      ]">
        <img 
          v-if="post.cover" 
          :src="post.cover" 
          :alt="post.title"
          class="w-full h-full object-cover"
        />
        <div 
          v-else 
          class="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
        >
          <UIcon name="i-lucide-image" class="w-12 h-12 text-gray-400" />
        </div>
      </div>

      <!-- Контент -->
      <div :class="[
        'p-4',
        props.isFull ? 'space-y-6' : 'h-[calc(32rem-16rem)] flex flex-col'
      ]">
        <!-- Заголовок -->
        <h3 :class="[
          'font-semibold text-gray-900 dark:text-white',
          props.isFull ? 'text-2xl mb-2' : 'text-base line-clamp-2 mb-2'
        ]">
          {{ post.title }}
        </h3>

        <!-- Ключевые слова -->
        <div class="flex flex-wrap gap-2 mb-3">
          <UBadge
            v-for="keyword in post.keywords.slice(0, props.isFull ? undefined : 3)"
            :key="keyword"
            color="primary"
            variant="soft"
            :size="props.isFull ? 'md' : 'sm'"
          >
            {{ keyword }}
          </UBadge>
        </div>

        <!-- Аннотация -->
        <p :class="[
          'text-gray-600 dark:text-gray-300',
          props.isFull 
            ? 'text-base mb-4' 
            : 'text-sm mb-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent'
        ]">
          {{ post.annotation }}
        </p>

        <!-- Автор и дата -->
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <!-- Один автор -->
            <template v-if="!Array.isArray(post.author)">
              <UserCard
                :user="post.author"
                class="flex-1"
                :compact="!props.isFull"
              />
            </template>
            
            <!-- Несколько авторов -->
            <template v-else>
              <div class="flex items-center gap-2">
                <div class="flex -space-x-2">
                  <div 
                    v-for="(author, index) in post.author.slice(0, 3)" 
                    :key="author.id"
                    class="relative"
                  >
                    <UserCard
                      :user="author"
                      :compact="!props.isFull"
                      class="border-2 border-white dark:border-gray-800"
                    />
                    <div 
                      v-if="index === 2 && post.author.length > 3"
                      class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full text-white text-xs font-medium"
                    >
                      +{{ post.author.length - 3 }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ formatDate(post.createdAt) }}
          </div>
        </div>

        <!-- Дополнительная информация для полного отображения -->
        <template v-if="props.isFull">
          <div class="prose dark:prose-invert max-w-none">
            {{ post.content }}
          </div>

          <div class="flex items-center justify-between pt-4 border-t dark:border-gray-700">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <UIcon name="i-lucide-eye" class="w-5 h-5" />
                <span>{{ post.views }}</span>
              </div>
              <div class="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <UIcon name="i-lucide-heart" class="w-5 h-5" />
                <span>{{ post.likes }}</span>
              </div>
              <div class="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <UIcon name="i-lucide-message-square" class="w-5 h-5" />
                <span>{{ post.comments }}</span>
              </div>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Обновлено: {{ formatDate(post.updatedAt) }}
            </div>
          </div>

          <!-- Список всех авторов в полном режиме -->
          <div v-if="Array.isArray(post.author) && post.author.length > 0" class="pt-4 border-t dark:border-gray-700">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Авторы ({{ post.author.length }})
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <UserCard
                v-for="author in post.author"
                :key="author.id"
                :user="author"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Modal только для краткого отображения -->
    <Teleport to="body" v-if="!props.isFull">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            class="fixed inset-0 bg-black/50"
            @click="isModalOpen = false"
          />

          <div
            ref="modalRef"
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto"
          >
            <div class="absolute top-4 right-4 flex items-center gap-2">
              <NuxtLink
                :to="`/posts/${post.id}`"
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
                @click="isModalOpen = false"
              >
                <UIcon name="i-lucide-external-link" class="w-5 h-5" />
                <span class="text-sm">Открыть пост</span>
              </NuxtLink>
            </div>

            <!-- Полное содержимое поста -->
            <div class="space-y-6">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ post.title }}
              </h1>

              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="keyword in post.keywords"
                  :key="keyword"
                  color="primary"
                  variant="soft"
                >
                  {{ keyword }}
                </UBadge>
              </div>

              <div class="prose dark:prose-invert max-w-none">
                {{ post.content }}
              </div>

              <div class="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                <UserCard :user="post.author" />
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(post.createdAt) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
  <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden w-128 h-128">
    <div class="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse" />
    <div class="p-4 space-y-3">
      <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div class="flex gap-2">
        <div class="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div class="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  </div>
</template>

<script setup lang="ts">
import UserCard from '~/components/user/Card.vue'

const props = defineProps<{
  post: Post | null
  isFull?: boolean
}>()

const isModalOpen = ref(false)
const modalRef = ref<HTMLElement | null>(null)

// Форматирование даты
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

// Close modal on click outside
const closeOnClickOutside = (event: MouseEvent) => {
  if (modalRef.value && 
      !modalRef.value.contains(event.target as Node) && 
      !(event.target as Element).closest('[data-post-card]')) {
    isModalOpen.value = false
  }
}

// Close modal on escape key
const closeOnEsc = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    isModalOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeOnClickOutside)
  document.addEventListener('keydown', closeOnEsc)
})

onUnmounted(() => {
  document.removeEventListener('click', closeOnClickOutside)
  document.removeEventListener('keydown', closeOnEsc)
})
</script>
