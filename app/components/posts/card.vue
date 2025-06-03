<template>
  <div v-if="post">
    <NuxtLink 
      :to="props.isFull ? undefined : `/posts/${post.id}`"
      :class="[
        'block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden relative',
        props.isFull ? 'cursor-default' : 'cursor-pointer w-128 h-128',
        {
          'border-2 border-primary-500': post.status === 'published',
          'border-2 border-yellow-500': post.status === 'draft',
          'border-2 border-red-500': post.status === 'archived'
        }
      ]"
    >
      <!-- Иконки действий -->
      <div v-if="!props.isFull" class="absolute top-2 right-2 z-10 flex items-center gap-2">
        <NuxtLink 
          v-if="canEditPost(post)"
          :to="`/article-builder?id=${post.id}`"
          class="p-1 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
          @click.stop
        >
          <UIcon 
            name="i-lucide-edit" 
            class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          />
        </NuxtLink>
        <NuxtLink 
          :to="`/posts/${post.id}`"
          class="p-1 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
          @click.stop
        >
          <UIcon 
            name="i-lucide-external-link" 
            class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          />
        </NuxtLink>
      </div>

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
            <!-- Владелец -->
            <div v-if="post?.owner" class="flex items-center gap-2 mb-2">
              <Avatar
                :src="post.owner.avatar || undefined"
                :email="post.owner.email || undefined"
                :alt="post.owner.displayName || 'Owner avatar'"
                :isActive="post.owner.emailVerified"
                size="sm"
              />
              <div class="text-sm text-gray-600 dark:text-gray-300">
                {{ post.owner.displayName || post.owner.email }}
                <span class="text-xs text-gray-500 dark:text-gray-400">(владелец)</span>
              </div>
            </div>
            
            <!-- Дополнительные авторы -->
            <div v-if="post?.author?.length > 1" class="flex items-center gap-2">
              <div class="flex -space-x-2">
                <div 
                  v-for="(author, index) in post?.author?.filter(a => a?.id !== post?.owner?.id).slice(0, 3) || []" 
                  :key="author.id"
                  class="relative"
                >
                  <Avatar
                    :src="author.avatar || undefined"
                    :email="author.email || undefined"
                    :alt="author.displayName || 'Author avatar'"
                    :isActive="author.emailVerified"
                    size="sm"
                    class="border-2 border-white dark:border-gray-800"
                  />
                  <div 
                    v-if="index === 2 && post?.author?.length > 4"
                    class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full text-white text-xs font-medium"
                  >
                    +{{ post.author.length - 4 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ post?.createdAt ? formatDate(post.createdAt) : '' }}
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
          <div v-if="post?.author?.length > 1" class="pt-4 border-t dark:border-gray-700">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Авторы ({{ post.author.length }})
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <!-- Владелец -->
              <div v-if="post.owner" class="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                <Avatar
                  :src="post.owner.avatar || undefined"
                  :email="post.owner.email || undefined"
                  :alt="post.owner.displayName || 'Owner avatar'"
                  :isActive="post.owner.emailVerified"
                  size="md"
                />
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ post.owner.displayName || post.owner.email }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    Владелец
                  </div>
                </div>
              </div>
              <!-- Дополнительные авторы -->
              <div
                v-for="author in post?.author?.filter(a => a?.id !== post?.owner?.id) || []"
                :key="author.id"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Avatar
                  :src="author.avatar || undefined"
                  :email="author.email || undefined"
                  :alt="author.displayName || 'Author avatar'"
                  :isActive="author.emailVerified"
                  size="md"
                />
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ author.displayName || author.email }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    Автор
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </NuxtLink>
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
import Avatar from '~/components/user/Avatar.vue'
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()
const props = defineProps<{
  post: Post | null
  isFull?: boolean
}>()

// Функция проверки прав на редактирование
const canEditPost = (post: Post) => {
  if (!userStore.user) return false
  return post.status === 'draft' && (
    post.ownerId === userStore.user.id || 
    post.authorId.includes(userStore.user.id)
  )
}

// Форматирование даты
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
