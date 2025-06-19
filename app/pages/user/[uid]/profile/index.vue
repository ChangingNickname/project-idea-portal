<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="pending" class="flex flex-col items-center justify-center gap-4 py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 text-primary animate-spin" />
      <p class="text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
    </div>
    <div v-else-if="error" class="text-center text-red-500">
      {{ error.message }}
    </div>
    <div v-else>
      <div v-if="isOwnProfile" class="mb-4 flex justify-end">
        <UButton
          v-if="!isEditMode"
          color="primary"
          @click="isEditMode = true"
        >
          <template #leading>
            <Icon name="lucide:pencil" class="w-5 h-5" />
          </template>
          {{ t('common.editProfile') }}
        </UButton>
      </div>
      <div
        v-else
        class="flex flex-row justify-end gap-2"
      >
        <UButton
          color="error"
          variant="outline"
          :icon="isBlacklist ? 'i-lucide-user-check' : 'i-lucide-user-x'"
          :label="isBlacklist ? t('profile.removeFromBlacklist') : t('profile.addToBlacklist')"
          @click="toggleBlacklist"
        />
        <UButton
          color="primary"
          variant="solid"
          :disabled="isBlacklist"
          :icon="isFriend ? 'i-lucide-user-minus' : 'i-lucide-user-plus'"
          :label="isFriend ? t('profile.removeFromFriends') : t('profile.addFriends')"
          @click="toggleFriend"
        />
      </div>

      <UserProfile
        :class="[
          isFriend ? 'border-2 border-primary' : '',
          isBlacklist ? 'opacity-50 border-2 border-black dark:border-white' : ''
        ]"
        :disabled="isBlacklist"
        v-if="!isEditMode && userData"
        :user="userData"
      />
      <UserProfileEdit
        v-else-if="isEditMode && userData"
        :user="userData"
        @cancel="isEditMode = false"
        @save="handleSave"
      />

      <!-- Blocked Users Section -->
      <div v-if="isOwnProfile" class="mt-8 space-y-8">
        <!-- Blocked Users -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ t('profile.blockedUsers') }}
              </h2>
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-plus"
                @click="showBlockedSearch = true"
              />
            </div>
            <UPagination
              v-if="blockedPagination.pages > 1"
              v-model="blockedPage"
              :total="blockedPagination.total"
              :page-count="blockedPagination.pages"
              :per-page="blockedPagination.limit"
            />
          </div>
          
          <div v-if="blockedPending" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin" />
          </div>
          
          <div v-else-if="blockedUsers.length === 0" class="text-center py-8">
            <UIcon name="i-lucide-user-x" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">
              {{ t('profile.noBlockedUsers') }}
            </p>
          </div>
          
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <UserCard
              v-for="blocked in blockedUsers"
              :key="blocked.id"
              :user="blocked.user"
              :is-friend="false"
              :is-blocked="true"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Blocked Users Search Modal -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="showBlockedSearch" class="fixed inset-0 z-50 flex items-center justify-center p-16">
        <div
          class="fixed inset-0 bg-black/50"
          @click="showBlockedSearch = false"
        />

        <div
          class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto"
        >
          <button
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            @click="showBlockedSearch = false"
          >
            <UIcon name="i-lucide-x" class="w-6 h-6" />
          </button>

          <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white pr-8">
            {{ t('profile.addToBlacklist') }}
          </h2>

          <UserSearch
            v-model="selectedBlocked"
            @select="handleAddBlocked"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { useToast } from '#imports'
import { ofetch } from 'ofetch'
import UserProfile from '~/components/user/profile/index.vue'
import UserProfileEdit from '~/components/user/profile/edit.vue'
import UserCard from '~/components/user/Card.vue'
import UserSearch from '~/components/user/search.vue'

const { t } = useI18n()
const route = useRoute()
const userStore = useUserStore()
const toast = useToast()

const uid = computed(() => route.params.uid as string)
const isOwnProfile = computed(() => userStore.user?.id === uid.value)

// Profile state
const userData = ref<User | null>(null)
const pending = ref(true)
const error = ref<Error | null>(null)
const isEditMode = ref(false)

// Relationship state
const isFriend = ref(false)
const isBlacklist = ref(false)
const isPendingFriend = ref(false)

// Blocked users state
const blockedUsers = ref<Array<{ id: string; user: User | null }>>([])
const blockedPending = ref(false)
const blockedPage = ref(1)
const blockedPagination = ref({
  total: 0,
  page: 1,
  limit: 9,
  pages: 1
})

// Search modals state
const showBlockedSearch = ref(false)
const selectedBlocked = ref<string[]>([])

// Fetch user data
const fetchUserData = async () => {
  try {
    userData.value = await $fetch<User>(`/api/user/${uid.value}/profile`)
  } catch (e) {
    error.value = e as Error
    console.error('Error fetching user data:', e)
  } finally {
    pending.value = false
  }
}

// Fetch relationship status
const fetchRelationshipStatus = async () => {
  try {
    const { status } = await $fetch<{ status: RelationStatus | null }>(`/api/user/${uid.value}/relationship`)
    isFriend.value = status === 'friend'
    isBlacklist.value = status === 'blacklist'
    isPendingFriend.value = false
  } catch (error) {
    console.error('Error fetching relationship status:', error)
  }
}

// Fetch blocked users
const fetchBlockedUsers = async () => {
  blockedPending.value = true
  try {
    const response = await $fetch<{
      blocked: Array<{ id: string; user: User | null }>;
      pagination: typeof blockedPagination.value;
    }>(`/api/user/${uid.value}/blocked`, {
      params: {
        page: blockedPage.value,
        limit: blockedPagination.value.limit
      }
    })
    blockedUsers.value = response.blocked || []
    blockedPagination.value = {
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 9,
      pages: response.pagination?.pages || 1
    }
  } catch (error) {
    console.error('Error fetching blocked users:', error)
    blockedUsers.value = []
    blockedPagination.value = {
      total: 0,
      page: 1,
      limit: 9,
      pages: 1
    }
  } finally {
    blockedPending.value = false
  }
}

// Handle profile save
const handleSave = async (updatedUser: User) => {
  try {
    const response = await ofetch<{ success: boolean; profile: User }>(`/api/user/${uid.value}/profile`, {
      method: 'PUT',
      body: updatedUser
    })

    userData.value = response.profile
    isEditMode.value = false

    toast.add({
      title: t('common.success'),
      description: t('common.profileUpdateSuccess'),
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (error: any) {
    console.error('Error saving profile:', error)
    
    toast.add({
      title: t('common.error'),
      description: error.data?.message || t('common.profileUpdateError'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Handle friend toggle
const toggleFriend = async () => {
  try {
    const action = isFriend.value ? 'remove' : 'add'
    await ofetch(`/api/user/${uid.value}/friend`, {
      method: 'PUT',
      body: { action }
    })
    
    isFriend.value = !isFriend.value
    
    toast.add({
      title: t('common.success'),
      description: isFriend.value 
        ? t('profile.friendAdded') 
        : t('profile.friendRemoved'),
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (error: any) {
    console.error('Error toggling friend status:', error)
    
    toast.add({
      title: t('common.error'),
      description: error.data?.message || t('common.operationFailed'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Handle blacklist toggle
const toggleBlacklist = async () => {
  try {
    const action = isBlacklist.value ? 'remove' : 'add'
    await ofetch(`/api/user/${uid.value}/blacklist`, {
      method: 'PUT',
      body: { action }
    })
    
    isBlacklist.value = !isBlacklist.value
    
    toast.add({
      title: t('common.success'),
      description: isBlacklist.value 
        ? t('profile.userBlocked') 
        : t('profile.userUnblocked'),
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (error: any) {
    console.error('Error toggling blacklist status:', error)
    
    toast.add({
      title: t('common.error'),
      description: error.data?.message || t('common.operationFailed'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Handle adding blocked users
const handleAddBlocked = async (selectedUsers: string[]) => {
  try {
    await ofetch(`/api/user/${uid.value}/blocked`, {
      method: 'PUT',
      body: { users: selectedUsers }
    })
    
    showBlockedSearch.value = false
    selectedBlocked.value = []
    await fetchBlockedUsers()
    
    toast.add({
      title: t('common.success'),
      description: t('profile.usersBlocked'),
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (error: any) {
    console.error('Error adding blocked users:', error)
    
    toast.add({
      title: t('common.error'),
      description: error.data?.message || t('common.operationFailed'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Watch for page changes
watch(blockedPage, () => {
  fetchBlockedUsers()
})

// Initialize data
onMounted(async () => {
  await Promise.all([
    fetchUserData(),
    fetchRelationshipStatus()
  ])
  
  if (isOwnProfile.value) {
    await fetchBlockedUsers()
  }
})
</script>