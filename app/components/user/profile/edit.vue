<template>
  <div class="rounded-lg shadow-lg overflow-hidden">
    <div class="p-6">
      <div class="flex flex-col gap-6">
        <!-- Header with cancel button -->
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
          <UButton
            color="error"
            variant="soft"
            @click="$emit('cancel')"
          >
            <template #leading>
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </template>
            Cancel
          </UButton>
        </div>

        <!-- Avatar and basic info -->
        <div class="flex items-center gap-4">
          <Avatar
            :src="editedUser.avatar || undefined"
            :email="editedUser.email || undefined"
            :alt="editedUser.displayName || 'User avatar'"
            :isActive="editedUser.emailVerified"
            size="xl"
          />
          <div class="flex-1 space-y-4">
            <UFormGroup label="Display Name">
              <UInput v-model="editedUser.displayName" />
            </UFormGroup>
            <UFormGroup label="Email">
              <UInput v-model="editedUser.email" type="email" disabled />
              <template #help>
                <span class="text-sm text-gray-500">Email cannot be changed</span>
              </template>
            </UFormGroup>
          </div>
        </div>

        <!-- Contacts -->
        <div class="space-y-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Contacts</h2>
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Phone">
              <UInput v-model="editedUser.contacts.phone" type="tel" />
            </UFormGroup>
            <UFormGroup label="Telegram">
              <UInput v-model="editedUser.contacts.telegram" />
            </UFormGroup>
            <UFormGroup label="WhatsApp">
              <UInput v-model="editedUser.contacts.whatsapp" />
            </UFormGroup>
            <UFormGroup label="Viber">
              <UInput v-model="editedUser.contacts.viber" />
            </UFormGroup>
            <UFormGroup label="Discord">
              <UInput v-model="editedUser.contacts.discord" />
            </UFormGroup>
            <UFormGroup label="LinkedIn">
              <UInput v-model="editedUser.contacts.linkedin" />
            </UFormGroup>
            <UFormGroup label="GitHub">
              <UInput v-model="editedUser.contacts.github" />
            </UFormGroup>
            <UFormGroup label="Website">
              <UInput v-model="editedUser.contacts.website" type="url" />
            </UFormGroup>
          </div>
        </div>

        <!-- Save button -->
        <div class="flex justify-end">
          <UButton
            color="primary"
            @click="handleSave"
          >
            <template #leading>
              <Icon name="heroicons:check" class="w-5 h-5" />
            </template>
            Save Changes
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Avatar from '~/components/user/Avatar.vue'

const props = defineProps<{
  user: User
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'save', user: User): void
}>()

// Create a deep copy of the user object for editing
const editedUser = ref<User>(JSON.parse(JSON.stringify(props.user)))

const handleSave = () => {
  emit('save', editedUser.value)
}
</script>
