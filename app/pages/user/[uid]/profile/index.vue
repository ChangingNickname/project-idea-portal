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

      <!-- Секция друзей и заблокированных пользователей -->
      <div v-if="isOwnProfile" class="mt-8 space-y-8">
        <!-- Друзья -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ t('profile.friends') }}
              </h2>
              <UButton
                color="primary"
                variant="ghost"
                icon="i-lucide-plus"
                @click="showFriendsSearch = true"
              />
            </div>
            <UPagination
              v-if="friendsPagination.pages > 1"
              v-model="friendsPage"
              :total="friendsPagination.total"
              :page-count="friendsPagination.pages"
              :per-page="friendsPagination.limit"
            />
          </div>
          
          <div v-if="friendsPending" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin" />
          </div>
          
          <div v-else-if="friends.length === 0" class="text-center py-8">
            <UIcon name="i-lucide-users" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">
              {{ t('profile.noFriends') }}
            </p>
          </div>
          
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="friend in friends" :key="friend.id" class="relative">
              <UserCard
                :user="friend.user || null"
                :isFriend="true"
              />
              <UButton
                v-if="friend.user"
                color="neutral"
                variant="outline"
                icon="i-lucide-user-minus"
                class="absolute top-2 right-2"
                @click="removeFriend(friend.user.id)"
              />
            </div>
          </div>
        </div>

        <!-- Заблокированные пользователи -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ t('profile.blockedUsers') }}
              </h2>
              <UButton
                color="primary"
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
            <div v-for="blocked in blockedUsers" :key="blocked.id" class="relative">
              <UserCard
                :user="blocked.user || null"
                :isBlocked="true"
              />
              <UButton
                v-if="blocked.user"
                color="neutral"
                variant="outline"
                icon="i-lucide-user-x"
                class="absolute top-2 right-2"
                @click="removeBlocked(blocked.user.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальные окна поиска -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div v-if="showFriendsSearch" class="fixed inset-0 z-50 flex items-center justify-center p-16">
          <div
            class="fixed inset-0 bg-black/50"
            @click="showFriendsSearch = false"
          />

          <div
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto"
          >
            <button
              class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              @click="showFriendsSearch = false"
            >
              <UIcon name="i-lucide-x" class="w-6 h-6" />
            </button>

            <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white pr-8">
              {{ t('profile.addFriends') }}
            </h2>

            <UserSearch
              v-model="selectedFriends"
              @select="handleAddFriends"
            />
          </div>
        </div>
      </Transition>

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
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import { useProfileStore } from '~/stores/profile'
import UserProfile from '~/components/user/profile/index.vue'
import UserProfileEdit from '~/components/user/profile/edit.vue'
import UserCard from '~/components/user/Card.vue'
import UserSearch from '~/components/user/search.vue'

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

// Состояние для друзей
const friends = ref<Array<{ id: string; user: User | null }>>([])
const friendsPending = ref(false)
const friendsPage = ref(1)
const friendsPagination = ref({
  total: 0,
  page: 1,
  limit: 9,
  pages: 1
})

// Состояние для заблокированных пользователей
const blockedUsers = ref<Array<{ id: string; user: User | null }>>([])
const blockedPending = ref(false)
const blockedPage = ref(1)
const blockedPagination = ref({
  total: 0,
  page: 1,
  limit: 9,
  pages: 1
})

const isOwnProfile = computed(() => {
  return userStore.user?.id === uid
})

// Состояние для модальных окон поиска
const showFriendsSearch = ref<boolean>(false)
const showBlockedSearch = ref<boolean>(false)
const selectedFriends = ref<string[]>([])
const selectedBlocked = ref<string[]>([])

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
    isPendingFriend.value = false
  } catch (error) {
    console.error('Ошибка получения статуса отношений:', error)
  }
}

// Загрузка друзей
const fetchFriends = async () => {
  if (!isOwnProfile.value) return
  
  friendsPending.value = true
  try {
    const response = await $fetch<{
      relationships: Array<{ id: string; user: User | null }>;
      pagination: typeof friendsPagination.value;
    }>('/api/user/relationship', {
      query: {
        type: 'friends',
        page: friendsPage.value,
        limit: friendsPagination.value.limit
      }
    })
    
    friends.value = response.relationships
    friendsPagination.value = response.pagination
  } catch (error) {
    console.error('Error fetching friends:', error)
    toast.add({
      title: t('common.error'),
      description: t('profile.friendsFetchError'),
      color: 'error'
    })
  } finally {
    friendsPending.value = false
  }
}

// Загрузка заблокированных пользователей
const fetchBlockedUsers = async () => {
  if (!isOwnProfile.value) return
  
  blockedPending.value = true
  try {
    const response = await $fetch<{
      relationships: Array<{ id: string; user: User | null }>;
      pagination: typeof blockedPagination.value;
    }>('/api/user/relationship', {
      query: {
        type: 'blocked',
        page: blockedPage.value,
        limit: blockedPagination.value.limit
      }
    })
    
    blockedUsers.value = response.relationships
    blockedPagination.value = response.pagination
  } catch (error) {
    console.error('Error fetching blocked users:', error)
    toast.add({
      title: t('common.error'),
      description: t('profile.blockedUsersFetchError'),
      color: 'error'
    })
  } finally {
    blockedPending.value = false
  }
}

// Обновляем данные при изменении статуса отношений
watch([isFriend, isBlacklist], () => {
  if (isOwnProfile.value) {
    fetchFriends()
    fetchBlockedUsers()
  }
})

// Загружаем данные при монтировании
onMounted(() => {
  if (isOwnProfile.value) {
    fetchFriends()
    fetchBlockedUsers()
  }
})

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

const removeFriend = async (targetUid: string) => {
  const { id: toastId } = toast.add({
    title: t('profile.removeFromFriends'),
    description: t('profile.removeFromFriendsConfirm'),
    color: 'neutral',
    icon: 'i-lucide-user-minus',
    actions: [
      {
        label: t('profile.cancel'),
        onClick: () => {
          toast.remove(toastId)
        }
      },
      {
        label: t('profile.remove'),
        color: 'error',
        onClick: async () => {
          try {
            await $fetch(`/api/user/${targetUid}/relationship`, {
              method: 'POST',
              body: { status: null }
            })
            
            await fetchFriends()
            
            toast.remove(toastId)
            toast.add({
              title: t('profile.success'),
              description: t('profile.userRemovedFromFriends'),
              color: 'success',
              icon: 'i-lucide-user-minus'
            })
          } catch (error) {
            console.error(t('profile.removeFromFriendsError'), error)
            toast.remove(toastId)
            toast.add({
              title: t('common.error'),
              description: t('profile.removeFromFriendsError'),
              color: 'error',
              icon: 'i-lucide-alert-circle'
            })
          }
        }
      }
    ]
  })
}

const removeBlocked = async (targetUid: string) => {
  const { id: toastId } = toast.add({
    title: t('profile.removeFromBlacklist'),
    description: t('profile.removeFromBlacklistConfirm'),
    color: 'neutral',
    icon: 'i-lucide-user-x',
    actions: [
      {
        label: t('profile.cancel'),
        onClick: () => {
          toast.remove(toastId)
        }
      },
      {
        label: t('profile.remove'),
        color: 'error',
        onClick: async () => {
          try {
            await $fetch(`/api/user/${targetUid}/relationship`, {
              method: 'POST',
              body: { status: null }
            })
            
            await fetchBlockedUsers()
            
            toast.remove(toastId)
            toast.add({
              title: t('profile.success'),
              description: t('profile.userRemovedFromBlacklist'),
              color: 'success',
              icon: 'i-lucide-user-x'
            })
          } catch (error) {
            console.error(t('profile.removeFromBlacklistError'), error)
            toast.remove(toastId)
            toast.add({
              title: t('common.error'),
              description: t('profile.removeFromBlacklistError'),
              color: 'error',
              icon: 'i-lucide-alert-circle'
            })
          }
        }
      }
    ]
  })
}

// Обработчики добавления пользователей
const handleAddFriends = async (userIds: string[]) => {
  try {
    await Promise.all(
      userIds.map(async (uid) => {
        await $fetch(`/api/user/${uid}/relationship`, {
          method: 'POST',
          body: { status: 'friend' }
        })
      })
    )

    // Обновляем список друзей
    await fetchFriends()
    
    // Закрываем модальное окно
    showFriendsSearch.value = false
    selectedFriends.value = []

    // Показываем уведомление
    toast.add({
      title: t('profile.success'),
      description: t('profile.usersAddedToFriends'),
      color: 'success',
      icon: 'i-lucide-user-plus'
    })
  } catch (error) {
    console.error(t('profile.addToFriendsError'), error)
    toast.add({
      title: t('common.error'),
      description: t('profile.addToFriendsError'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

const handleAddBlocked = async (userIds: string[]) => {
  try {
    await Promise.all(
      userIds.map(async (uid) => {
        await $fetch(`/api/user/${uid}/relationship`, {
          method: 'POST',
          body: { status: 'blacklist' }
        })
      })
    )

    // Обновляем список заблокированных
    await fetchBlockedUsers()
    
    // Закрываем модальное окно
    showBlockedSearch.value = false
    selectedBlocked.value = []

    // Показываем уведомление
    toast.add({
      title: t('profile.success'),
      description: t('profile.usersAddedToBlacklist'),
      color: 'success',
      icon: 'i-lucide-user-x'
    })
  } catch (error) {
    console.error(t('profile.addToBlacklistError'), error)
    toast.add({
      title: t('common.error'),
      description: t('profile.addToBlacklistError'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

// Закрытие по Escape
const closeOnEsc = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showFriendsSearch.value = false
    showBlockedSearch.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', closeOnEsc)
})

onUnmounted(() => {
  document.removeEventListener('keydown', closeOnEsc)
})

</script>