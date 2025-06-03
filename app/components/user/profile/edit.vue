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

        <UForm
          :state="formState"
          @submit="handleSubmit"
          class="space-y-6"
        >
          <!-- Basic Info -->
          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('common.basicInfo') }}</h2>
            <div class="grid grid-cols-2 gap-4">
              <UFormField
                :label="t('common.id')"
                name="id"
              >
                <UInput
                  v-model="formState.id"
                  disabled
                  :placeholder="t('common.idInput')"
                >
                  <template #leading>
                    <Icon name="heroicons:identification" class="w-5 h-5 text-gray-400" />
                  </template>
                </UInput>
              </UFormField>
              <UFormField
                :label="t('common.email')"
                name="email"
              >
                <UInput
                  v-model="formState.email"
                  disabled
                  :placeholder="t('common.emailInput')"
                >
                  <template #leading>
                    <Icon name="heroicons:envelope" class="w-5 h-5 text-gray-400" />
                  </template>
                </UInput>
                <template #help>
                  <span class="text-sm text-gray-500">{{ t('common.emailCannotBeChanged') }}</span>
                </template>
              </UFormField>
            </div>
          </div>

          <!-- Avatar -->
          <div class="flex items-center gap-4">
            <div class="relative group">
              <Avatar
                :src="formState.avatar || undefined"
                :email="formState.email || undefined"
                :alt="formState.displayName || 'User avatar'"
                :isActive="formState.emailVerified"
                size="xl"
              />
              <label 
                class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
              >
                <Icon name="heroicons:camera" class="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleImageUpload"
                />
              </label>
            </div>
            <div class="flex-1 space-y-4">
              <UFormField
                :label="t('common.displayName')"
                name="displayName"
              >
                <UInput
                  v-model="formState.displayName"
                  :placeholder="t('common.displayNameInput')"
                >
                  <template #leading>
                    <Icon name="heroicons:user" class="w-5 h-5 text-gray-400" />
                  </template>
                </UInput>
              </UFormField>
            </div>
          </div>

          <!-- Verification Status -->
          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('common.verificationStatus') }}</h2>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Icon 
                  :name="formState.emailVerified ? 'heroicons:shield-check' : 'heroicons:shield-exclamation'" 
                  class="w-5 h-5"
                  :class="formState.emailVerified ? 'text-green-500' : 'text-yellow-500'"
                />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ formState.emailVerified ? t('common.emailVerified') : t('common.emailNotVerified') }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ formState.email }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Contacts -->
          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('common.contacts') }}</h2>
            <div class="grid grid-cols-2 gap-4">
              <UFormField
                :label="t('common.phone')"
                name="contacts.phone"
              >
                <UInput
                  v-model="formState.contacts.phone"
                  type="tel"
                  :placeholder="t('common.phoneInput')"
                  @input="(e: Event) => formState.contacts.phone = formatPhoneNumber((e.target as HTMLInputElement).value)"
                >
                  <template #leading>
                    <Icon name="heroicons:phone" class="w-5 h-5 text-gray-400" />
                  </template>
                </UInput>
              </UFormField>
              <UFormField
                :label="t('common.telegram')"
                name="contacts.telegram"
              >
                <UInput
                  v-model="formState.contacts.telegram"
                  :placeholder="t('common.telegramInput')"
                >
                  <template #leading>
                    <Icon name="simple-icons:telegram" class="w-5 h-5 text-[#26A5E4]" />
                  </template>
                </UInput>
              </UFormField>
              <UFormField
                :label="t('common.whatsapp')"
                name="contacts.whatsapp"
              >
                <UInput
                  v-model="formState.contacts.whatsapp"
                  :placeholder="t('common.whatsappInput')"
                >
                  <template #leading>
                    <Icon name="simple-icons:whatsapp" class="w-5 h-5 text-[#25D366]" />
                  </template>
                </UInput>
              </UFormField>
              <UFormField
                :label="t('common.viber')"
                name="contacts.viber"
              >
                <UInput
                  v-model="formState.contacts.viber"
                  :placeholder="t('common.viberInput')"
                >
                  <template #leading>
                    <Icon name="simple-icons:viber" class="w-5 h-5 text-[#7360F2]" />
                  </template>
                </UInput>
              </UFormField>
              <UFormField
                :label="t('common.discord')"
                name="contacts.discord"
              >
                <UInput
                  v-model="formState.contacts.discord"
                  :placeholder="t('common.discordInput')"
                >
                  <template #leading>
                    <Icon name="simple-icons:discord" class="w-5 h-5 text-[#5865F2]" />
                  </template>
                </UInput>
              </UFormField>
              <UFormField
                :label="t('common.linkedin')"
                name="contacts.linkedin"
              >
                <UInput
                  v-model="formState.contacts.linkedin"
                  :placeholder="t('common.linkedinInput')"
                >
                  <template #leading>
                    <Icon name="simple-icons:linkedin" class="w-5 h-5 text-[#0A66C2]" />
                  </template>
                </UInput>
              </UFormField>
              <UFormField
                :label="t('common.github')"
                name="contacts.github"
              >
                <UInput
                  v-model="formState.contacts.github"
                  :placeholder="t('common.githubInput')"
                >
                  <template #leading>
                    <Icon name="simple-icons:github" class="w-5 h-5 text-[#181717] dark:text-white" />
                  </template>
                </UInput>
              </UFormField>
              <UFormField
                :label="t('common.website')"
                name="contacts.website"
              >
                <UInput
                  v-model="formState.contacts.website"
                  type="url"
                  :placeholder="t('common.websiteInput')"
                >
                  <template #leading>
                    <Icon name="heroicons:globe-alt" class="w-5 h-5 text-gray-400" />
                  </template>
                </UInput>
              </UFormField>
            </div>
          </div>

          <!-- Provider Info -->
          <div v-if="formState.providerData?.length" class="space-y-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('common.connectedAccounts') }}</h2>
            <div class="flex flex-wrap gap-2">
              <div v-for="provider in formState.providerData" 
                   :key="provider.providerId"
                   class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                <Icon :name="getProviderIcon(provider.providerId)" class="w-4 h-4" />
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  {{ formatProviderName(provider.providerId) }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="profileStore.error" class="text-red-500 text-sm text-center">
            {{ profileStore.error }}
          </div>

          <!-- Save button -->
          <div class="flex justify-end">
            <UButton
              type="submit"
              color="primary"
              :loading="profileStore.loading"
            >
              <template #leading>
                <Icon name="heroicons:check" class="w-5 h-5" />
              </template>
              {{ t('common.saveChanges') }}
            </UButton>
          </div>
        </UForm>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import Avatar from '~/components/user/Avatar.vue'
import { useProfileStore } from '~/stores/profile'
import { useUserStore } from '~/stores/user'

const { t } = useI18n()
const toast = useToast()
const profileStore = useProfileStore()
const userStore = useUserStore()

const props = defineProps<{
  user: User
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'save', user: User): void
}>()

// Create form state from user data
const formState = reactive<User>({
  ...JSON.parse(JSON.stringify(props.user)),
  email: userStore.user?.email || '',
  contacts: {
    ...props.user.contacts,
    phone: props.user.contacts?.phone || '',
    telegram: props.user.contacts?.telegram || '',
    whatsapp: props.user.contacts?.whatsapp || '',
    viber: props.user.contacts?.viber || '',
    discord: props.user.contacts?.discord || '',
    linkedin: props.user.contacts?.linkedin || '',
    github: props.user.contacts?.github || '',
    website: props.user.contacts?.website || ''
  }
})

// Функция для форматирования телефона
const formatPhoneNumber = (value: string): string => {
  if (!value) return ''
  // Удаляем все нецифровые символы
  const numbers = value.replace(/\D/g, '')
  // Форматируем номер: +7 (XXX) XXX-XX-XX
  const match = numbers.match(/^(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})$/)
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`
  }
  return value
}

const getProviderIcon = (providerId: string) => {
  const icons: Record<string, string> = {
    'google.com': 'simple-icons:google',
    'facebook.com': 'simple-icons:facebook',
    'github.com': 'simple-icons:github',
    'twitter.com': 'simple-icons:twitter',
    'password': 'heroicons:key'
  }
  return icons[providerId] || 'heroicons:user'
}

const formatProviderName = (providerId: string) => {
  const names: Record<string, string> = {
    'google.com': 'Google',
    'facebook.com': 'Facebook',
    'github.com': 'GitHub',
    'twitter.com': 'Twitter',
    'password': 'Email'
  }
  return names[providerId] || providerId
}

const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.add({
      title: t('common.error'),
      description: t('common.invalidImageType'),
      color: 'error'
    })
    return
  }

  try {
    // Create image element to get dimensions
    const img = new Image()
    const imgUrl = URL.createObjectURL(file)
    
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = imgUrl
    })

    // Create canvas for cropping
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    // Set canvas size to 128x128
    canvas.width = 128
    canvas.height = 128

    // Calculate dimensions to maintain aspect ratio
    const size = Math.min(img.width, img.height)
    const startX = (img.width - size) / 2
    const startY = (img.height - size) / 2

    // Draw cropped image
    ctx.drawImage(
      img,
      startX, startY, size, size,  // Source rectangle
      0, 0, 128, 128              // Destination rectangle
    )

    // Convert to base64
    const base64 = canvas.toDataURL('image/jpeg', 0.8)
    formState.avatar = base64

    // Cleanup
    URL.revokeObjectURL(imgUrl)
    input.value = '' // Reset input

    toast.add({
      title: t('common.success'),
      description: t('common.imageUploadSuccess'),
      color: 'success'
    })
  } catch (error) {
    console.error('Image processing error:', error)
    toast.add({
      title: t('common.error'),
      description: t('common.imageUploadError'),
      color: 'error'
    })
  }
}

const handleSubmit = async () => {
  try {
    // Очищаем пустые поля контактов
    const cleanedContacts: UserContacts = {
      email: formState.contacts.email,
      phone: formState.contacts.phone || null,
      telegram: formState.contacts.telegram || null,
      whatsapp: formState.contacts.whatsapp || null,
      viber: formState.contacts.viber || null,
      discord: formState.contacts.discord || null,
      linkedin: formState.contacts.linkedin || null,
      github: formState.contacts.github || null,
      website: formState.contacts.website || null
    }

    const updatedUser = {
      ...formState,
      contacts: cleanedContacts
    }

    emit('save', updatedUser)
  } catch (error) {
    console.error('Form submission error:', error)
    toast.add({
      title: t('common.error'),
      description: t('common.profileUpdateError'),
      color: 'error'
    })
  }
}
</script>
