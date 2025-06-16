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
        post.value = response as Post
    } catch (error) {
        console.error('Failed to fetch post:', error)
        post.value = null
    }

    // View count logic
    nextTick(() => {
        if (!endOfPost.value || !userStore.user?.id || !post.value) return
        const observer = new IntersectionObserver(async (entries) => {
            const entry = entries[0]
            if (entry && entry.isIntersecting && !hasMarkedViewed && post.value && userStore.user) {
                hasMarkedViewed = true
                try {
                    const newViews = (post.value.views || 0) + 1
                    await $fetch(`/api/posts/meta/${post.value.id}`, {
                        method: 'POST',
                        body: { views: newViews }
                    })
                    if (post.value) {
                        post.value.views = newViews
                        post.value.viewedBy = [...(post.value.viewedBy || []), userStore.user.id]
                    }
                } catch (e) {
                    console.error('Failed to mark post as viewed:', e)
                }
            }
        }, { threshold: 1.0 })
        observer.observe(endOfPost.value)
    })
})
</script>