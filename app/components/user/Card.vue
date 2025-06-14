<template>
  <div v-if="user">
    <div 
      data-user-card
      class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
      @click="isModalOpen = true"
    >
      <Avatar
        :src="user?.avatar || undefined"
        :email="user?.email || undefined"
        :alt="user?.displayName || t('common.userAvatar')"
        :isActive="user?.emailVerified"
        :isBlocked="isBlocked"
        size="md"
      />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ user?.displayName || user?.email || t('common.anonymousUser') }}
          </p>
          <Icon 
            v-if="user?.emailVerified" 
            name="heroicons:check-badge" 
            class="w-4 h-4 text-primary"
          />
        </div>
        <p v-if="user?.position" class="text-xs text-gray-500 dark:text-gray-400 truncate">
          {{ user.position }}
        </p>
        <p v-if="user?.displayName && user?.email" class="text-xs text-gray-500 dark:text-gray-400 truncate">
          {{ user?.email }}
        </p>
        <div v-if="user?.contacts" class="flex items-center gap-2 mt-1">
          <Icon 
            v-if="user?.contacts?.phone" 
            name="heroicons:phone" 
            class="w-4 h-4"
          />
          <Icon 
            v-if="user?.contacts?.telegram" 
            name="simple-icons:telegram" 
            class="w-4 h-4 text-[#26A5E4]"
          />
          <Icon 
            v-if="user?.contacts?.whatsapp" 
            name="simple-icons:whatsapp" 
            class="w-4 h-4 text-[#25D366]"
          />
          <Icon 
            v-if="user?.contacts?.viber" 
            name="simple-icons:viber" 
            class="w-4 h-4 text-[#7360F2]"
          />
          <Icon 
            v-if="user?.contacts?.discord" 
            name="simple-icons:discord" 
            class="w-4 h-4 text-[#5865F2]"
          />
          <Icon 
            v-if="user?.contacts?.linkedin" 
            name="simple-icons:linkedin" 
            class="w-4 h-4 text-[#0A66C2]"
          />
          <Icon 
            v-if="user?.contacts?.github" 
            name="simple-icons:github" 
            class="w-4 h-4 text-[#181717] dark:text-white"
          />
          <Icon 
            v-if="user?.contacts?.website" 
            name="heroicons:globe-alt" 
            class="w-4 h-4"
          />
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
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
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto"
          >
            <div class="absolute top-4 right-4 flex items-center gap-2">
              <NuxtLink
                :to="`/user/${user.id}/profile`"
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
                @click="isModalOpen = false"
              >
                <UIcon name="i-lucide-external-link" class="w-5 h-5" />
                <span class="text-sm">{{ t('common.openProfile') }}</span>
              </NuxtLink>
            </div>

            <UserProfile
              :user="user"
              :class="[
                isFriend ? 'border-2 border-primary' : '',
                isBlocked ? 'opacity-50 border-2 border-black dark:border-white' : ''
              ]"
              :disabled="isBlocked"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
  <div v-else class="flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
    <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse" />
    <div class="flex-1">
      <div class="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
      <div class="h-3 w-32 bg-gray-200 dark:bg-gray-600 rounded mt-2 animate-pulse" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Avatar from '~/components/user/Avatar.vue'
import UserProfile from '~/components/user/profile/index.vue'

const props = defineProps<{
  user: User | null
  isFriend?: boolean
  isBlocked?: boolean
}>()

const { t } = useI18n()

const isModalOpen = ref(false)
const modalRef = ref<HTMLElement | null>(null)

// Close modal on click outside
const closeOnClickOutside = (event: MouseEvent) => {
  if (modalRef.value && 
      !modalRef.value.contains(event.target as Node) && 
      !(event.target as Element).closest('[data-user-card]')) {
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
