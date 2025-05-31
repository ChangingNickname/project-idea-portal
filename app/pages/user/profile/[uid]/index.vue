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
            <Icon name="heroicons:pencil-square" class="w-5 h-5" />
          </template>
          {{ t('common.editProfile') }}
        </UButton>
      </div>

      <UserProfile
        v-if="!isEditMode && userData"
        :user="userData"
      />
      <UserProfileEdit
        v-else-if="isEditMode && userData"
        :user="userData"
        @cancel="isEditMode = false"
        @save="handleSave"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import { useProfileStore } from '~/stores/profile'
import UserProfile from '~/components/user/profile/index.vue'
import UserProfileEdit from '~/components/user/profile/edit.vue'

const route = useRoute()
const userStore = useUserStore()
const profileStore = useProfileStore()
const toast = useToast()
const { t } = useI18n()

const uid = route.params.uid as string
const userData = ref<User | null>(null)
const error = ref<Error | null>(null)
const pending = ref(true)
const isEditMode = ref(false)

const isOwnProfile = computed(() => {
  return userStore.user?.id === uid
})

// Загрузка данных пользователя
const fetchUserData = async () => {
  try {
    userData.value = await $fetch<User>(`/api/user/profile/${uid}`)
  } catch (e) {
    error.value = e as Error
    console.error('Error fetching user data:', e)
  } finally {
    pending.value = false
  }
}

// Вызываем загрузку данных
fetchUserData()

const handleSave = async (updatedUser: User) => {
  try {
    // Показываем уведомление о начале сохранения
    toast.add({
      title: t('common.saving'),
      description: t('common.savingProfile'),
      color: 'primary',
      icon: 'i-heroicons-arrow-path',
      loading: true
    })

    // Отправляем запрос на сервер
    const response = await $fetch(`/api/user/profile/${uid}`, {
      method: 'POST',
      body: updatedUser
    })

    // Обновляем данные в компоненте
    userData.value = response.profile

    // Обновляем данные в store
    if (isOwnProfile.value) {
      userStore.updateUser(response.profile)
    }

    // Показываем уведомление об успехе
    toast.add({
      title: t('common.success'),
      description: t('common.profileUpdateSuccess'),
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })

    // Выходим из режима редактирования
    isEditMode.value = false
  } catch (error: any) {
    console.error('Error saving profile:', error)
    
    // Показываем уведомление об ошибке
    toast.add({
      title: t('common.error'),
      description: error.data?.message || t('common.profileUpdateError'),
      color: 'error',
      icon: 'i-heroicons-exclamation-circle'
    })
  }
}
</script>