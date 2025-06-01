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
        :label="isBlacklist ? 'Удалить из черного списка' : 'Добавить в черный список'"
        @click="toggleBlacklist"
        />
        <UButton
        color="primary"
        variant="solid"
        :disabled="isBlacklist"
        :icon="isFriend ? 'i-lucide-user-minus' : 'i-lucide-user-plus'"
        :label="isFriend ? 'Удалить из друзей' : 'Добавить в друзья'"
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
const isFriend = ref(false)
const isBlacklist = ref(false)
const isPendingFriend = ref(false)

const isOwnProfile = computed(() => {
  return userStore.user?.id === uid
})

// Загрузка данных пользователя
const fetchUserData = async () => {
  try {
    userData.value = await $fetch<User>(`/api/user/${uid}/profile`)
  } catch (e) {
    error.value = e as Error
    console.error('Error fetching user data:', e)
  } finally {
    pending.value = false
  }
}

// Загрузка статуса отношений
const fetchRelationshipStatus = async () => {
  try {
    const { status } = await $fetch<{ status: RelationStatus | null }>(`/api/user/${uid}/relationship`)
    isFriend.value = status === 'friend'
    isBlacklist.value = status === 'blacklist'
    isPendingFriend.value = status === 'pending_friend'
  } catch (error) {
    console.error('Ошибка получения статуса отношений:', error)
  }
}

// Вызываем загрузку данных и статуса отношений
fetchUserData()
fetchRelationshipStatus()

const toggleFriend = async () => {
  try {
    const newStatus = isFriend.value ? null : 'friend'
    await $fetch(`/api/user/${uid}/relationship`, {
      method: 'POST',
      body: { status: newStatus }
    })
    isFriend.value = !isFriend.value
    isPendingFriend.value = false
    isBlacklist.value = false

    // Показываем уведомление
    toast.add({
      title: isFriend.value ? 'Добавлено в друзья' : 'Удалено из друзей',
      color: 'success',
      icon: isFriend.value ? 'i-lucide-user-plus' : 'i-lucide-user-minus'
    })
  } catch (error) {
    console.error('Ошибка обновления статуса дружбы:', error)
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось обновить статус дружбы',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

const toggleBlacklist = async () => {
  try {
    const newStatus = isBlacklist.value ? null : 'blacklist'
    await $fetch(`/api/user/${uid}/relationship`, {
      method: 'POST',
      body: { status: newStatus }
    })
    isBlacklist.value = !isBlacklist.value
    isFriend.value = false
    isPendingFriend.value = false

    // Показываем уведомление
    toast.add({
      title: isBlacklist.value ? 'Добавлено в черный список' : 'Удалено из черного списка',
      color: 'success',
      icon: isBlacklist.value ? 'i-lucide-user-x' : 'i-lucide-user-check'
    })
  } catch (error) {
    console.error('Ошибка обновления черного списка:', error)
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось обновить черный список',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

const handleSave = async (updatedUser: User) => {
  try {
    // Показываем уведомление о начале сохранения
    toast.add({
      title: t('common.saving'),
      description: t('common.savingProfile'),
      color: 'primary',
      icon: 'i-lucide-loader-2'
    })

    // Отправляем запрос на сервер
    const response = await $fetch<{ success: boolean; profile: User }>(`/api/user/${uid}/profile`, {
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
      icon: 'i-lucide-check-circle'
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
      icon: 'i-lucide-alert-circle'
    })
  }
}

const addFriend = async () => {
  console.log('addFriend')
}

const addBlacklist = async () => {
  console.log('addBlacklist')
}


</script>