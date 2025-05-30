<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="pending" class="flex justify-center">
      <ULoadingIcon />
    </div>
    <div v-else-if="error" class="text-center text-red-500">
      {{ error.message }}
    </div>
    <template v-else>
      <div v-if="isOwnProfile" class="mb-4 flex justify-end">
        <UButton
          v-if="!isEditMode"
          color="primary"
          @click="isEditMode = true"
        >
          <template #leading>
            <Icon name="heroicons:pencil-square" class="w-5 h-5" />
          </template>
          Edit Profile
        </UButton>
      </div>

      <UserProfile
        v-if="!isEditMode"
        :user="userData as User"
      />
      <UserProfileEdit
        v-else
        :user="userData as User"
        @cancel="isEditMode = false"
        @save="handleSave"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import UserProfile from '~/components/user/profile/index.vue'
import UserProfileEdit from '~/components/user/profile/edit.vue'

const route = useRoute()
const userStore = useUserStore()
const uid = route.params.uid as string
const userData = ref<User | null>(null)
const error = ref<Error | null>(null)
const pending = ref(true)
const isEditMode = ref(false)

const isOwnProfile = computed(() => {
  return userStore.user?.id === uid
})

try {
  userData.value = await $fetch<User>(`/api/user/profile/${uid}`)
} catch (e) {
  error.value = e as Error
  console.error('Error fetching user data:', e)
} finally {
  pending.value = false
}

const handleSave = (updatedUser: User) => {
  // TODO: Implement save functionality
  console.log('Saving user data:', updatedUser)
  isEditMode.value = false
}
</script>