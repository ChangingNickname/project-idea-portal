<template>
  <div class="space-y-4">
    <!-- Поисковая строка -->
    <div class="flex gap-2">
      <UInput
        v-model="searchQuery"
        placeholder="Поиск пользователей..."
        icon="i-lucide-search"
        class="flex-1"
        :loading="pending"
        @input="debouncedSearch"
      />
      <UButton
        color="primary"
        :disabled="!selectedUsers.length"
        @click="handleSelect"
      >
        Выбрать ({{ selectedUsers.length }})
      </UButton>
    </div>

    <!-- Переключатели -->
    <div class="flex gap-4">
      <UCheckbox
        v-model="showBlocked"
        label="Показывать заблокированных"
      />
      <UCheckbox
        v-model="friendsFirst"
        label="Друзья в начале"
      />
    </div>

    <!-- Результаты поиска -->
    <div v-if="pending" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin" />
    </div>

    <div v-else-if="error" class="text-center text-red-500 py-4">
      {{ error.message }}
    </div>

    <div v-else-if="!users.length" class="text-center text-gray-500 py-4">
      Пользователи не найдены
    </div>

    <div v-else class="space-y-4">
      <div class="space-y-2">
        <div
          v-for="user in users"
          :key="user.id"
          class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <UCheckbox
            :model-value="selectedUsers.includes(user.id)"
            @update:model-value="(value) => {
              if (value) {
                selectedUsers.push(user.id)
              } else {
                selectedUsers = selectedUsers.filter(id => id !== user.id)
              }
            }"
            :label="user.displayName || user.email || 'Anonymous User'"
            class="flex-1"
          />
          <Avatar
            :src="user.avatar || undefined"
            :email="user.email || undefined"
            :alt="user.displayName || 'User avatar'"
            :isActive="user.emailVerified"
            size="sm"
          />
        </div>
      </div>

      <!-- Пагинация -->
      <div class="flex justify-center">
        <UPagination
          v-model="currentPage"
          :total="pagination.total"
          :page-count="pagination.pages"
          :per-page="pagination.limit"
        />
      </div>
    </div>

    <!-- Выбранные пользователи -->
    <div v-if="selectedUsers.length" class="flex flex-wrap gap-2">
      <UBadge
        v-for="userId in selectedUsers"
        :key="userId"
        color="primary"
        variant="soft"
        class="flex items-center gap-1"
      >
        {{ getUserName(userId) }}
        <UIcon
          name="i-lucide-x"
          class="w-4 h-4 cursor-pointer"
          @click="selectedUsers = selectedUsers.filter(id => id !== userId)"
        />
      </UBadge>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import Avatar from '~/components/user/Avatar.vue'

const props = defineProps<{
  modelValue?: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [string[]]
  'select': [string[]]
}>()

const searchQuery = ref('')
const showBlocked = ref(false)
const friendsFirst = ref(true)
const selectedUsers = ref<string[]>(props.modelValue || [])
const users = ref<User[]>([])
const pending = ref(false)
const error = ref<Error | null>(null)
const currentPage = ref(1)
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  pages: 1
})

// Отслеживаем изменения выбранных пользователей
watch(selectedUsers, (newValue) => {
  emit('update:modelValue', newValue)
})

// Получаем имя пользователя по ID
const getUserName = (userId: string) => {
  const user = users.value.find(u => u.id === userId)
  return user?.displayName || user?.email || 'Unknown User'
}

// Поиск пользователей
const searchUsers = async () => {
  if (!searchQuery.value) {
    users.value = []
    return
  }

  pending.value = true
  error.value = null

  try {
    const response = await $fetch<{
      users: User[]
      pagination: {
        total: number
        page: number
        limit: number
        pages: number
      }
    }>('/api/user/search', {
      query: {
        q: searchQuery.value,
        showBlocked: showBlocked.value,
        friendsFirst: friendsFirst.value,
        page: currentPage.value,
        limit: pagination.value.limit
      }
    })

    users.value = response.users
    pagination.value = response.pagination
  } catch (e) {
    error.value = e as Error
    console.error('Ошибка поиска пользователей:', e)
  } finally {
    pending.value = false
  }
}

// Дебаунс поиска
const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1
  searchUsers()
}, 300)

// Обработка выбора пользователей
const handleSelect = () => {
  emit('select', selectedUsers.value)
}

// Следим за изменениями фильтров
watch([showBlocked, friendsFirst], () => {
  if (searchQuery.value) {
    currentPage.value = 1
    searchUsers()
  }
})

// Следим за изменением страницы
watch(currentPage, () => {
  if (searchQuery.value) {
    searchUsers()
  }
})
</script>
