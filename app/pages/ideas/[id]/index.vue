<template>
    <div class="w-full">
        <template v-if="post">
            <PostsFull :post="post" />
            <div ref="endOfPost" style="height: 1px;"></div>
        </template>
        <div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">
            {{ t('common.loading') }}
        </div>
    </div>
</template>

<script setup lang="ts">
import PostsFull from '~/components/posts/full.vue'
import { useI18n } from 'vue-i18n'
const route = useRoute()
const post = ref<Post | null>(null)
const endOfPost = ref<HTMLElement | null>(null)
import { useUserStore } from '~/stores/user'
const userStore = useUserStore()
let hasMarkedViewed = false

const { t } = useI18n()

onMounted(async () => {
    try {
        const response = await $fetch(`/api/posts/${route.params.id}`)
        post.value = {
          ...response,
          author: Array.isArray(response.author) ? response.author.filter(Boolean) : []
        } as Post
    } catch (error) {
        post.value = null
        // Можно добавить обработку ошибки
    }

    // Логика увеличения просмотров
    nextTick(() => {
      if (!endOfPost.value || !userStore.user?.id || !post.value) return
      const observer = new IntersectionObserver(async (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting && !hasMarkedViewed && post.value && userStore.user) {
          hasMarkedViewed = true
          try {
            await $fetch(`/api/posts/${post.value.id}`, {
              method: 'post',
              body: { userId: userStore.user.id }
            })
          } catch (e) {
            // ignore
          }
        }
      }, { threshold: 1.0 })
      observer.observe(endOfPost.value)
    })
})
</script>