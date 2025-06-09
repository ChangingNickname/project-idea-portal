<template>
  <div>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div v-if="props.modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-16">
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div
              v-if="props.modelValue"
              class="fixed inset-0 bg-black/50"
              @click="closeModal"
            />
          </Transition>
        
          <div
            ref="modalRef"
            class="relative rounded-lg shadow-xl p-6 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto"
          >
            <UCard class="w-full">
              <template #header>
                <div class="flex items-center justify-between">
                  <h2 class="text-2xl font-bold">{{ $t('common.register') }}</h2>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-x-mark"
                    @click="closeModal"
                  />
                </div>
              </template>

              <UForm
                :state="{ email, password, confirmPassword, displayName, position }"
                @submit="handleRegister"
                class="space-y-4"
              >
                <UFormField
                  :label="$t('common.email')"
                  name="email"
                >
                  <UInput
                    v-model="email"
                    type="email"
                    :placeholder="$t('common.emailInput')"
                    required
                    autocomplete="email"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  :label="$t('common.displayName')"
                  name="displayName"
                >
                  <UInput
                    v-model="displayName"
                    :placeholder="$t('common.displayNameInput')"
                    required
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  :label="$t('common.position')"
                  name="position"
                >
                  <UInput
                    v-model="position"
                    :placeholder="$t('common.positionInput')"
                    class="w-full"
                  />
                </UFormField>

                <div class="flex items-center gap-4">
                  <div class="relative group">
                    <Avatar
                      :src="avatar || undefined"
                      :email="email || undefined"
                      :alt="displayName || 'User avatar'"
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
                  <div class="flex-1">
                    <p class="text-sm text-gray-500">{{ $t('common.avatarHelp') }}</p>
                  </div>
                </div>

                <UFormField
                  :label="$t('common.password')"
                  name="password"
                >
                  <UInput
                    v-model="password"
                    type="password"
                    :placeholder="$t('common.passwordInput')"
                    required
                    autocomplete="new-password"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  :label="$t('common.confirmPassword')"
                  name="confirmPassword"
                >
                  <UInput
                    v-model="confirmPassword"
                    type="password"
                    :placeholder="$t('common.confirmPasswordInput')"
                    required
                    autocomplete="new-password"
                    class="w-full"
                  />
                </UFormField>

                <div v-if="error" class="text-red-500 text-sm text-center">{{ error }}</div>

                <UButton
                  type="submit"
                  color="primary"
                  class="w-full"
                  :loading="loading"
                >
                  {{ $t('common.register') }}
                </UButton>
              </UForm>

              <template #footer>
                <div class="flex justify-center">
                  <UButton
                    variant="link"
                    class="text-sm text-primary-500 hover:text-primary-600"
                    @click="openLogin"
                  >
                    {{ $t('common.alreadyHaveAccount') }} <span class="underline">{{ $t('common.signIn') }}</span>
                  </UButton>
                </div>
              </template>
            </UCard>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, toRefs } from 'vue'
import { 
  createUserWithEmailAndPassword,
  storeUserAndRedirect 
} from '~/utils/firebase/auth'
import Avatar from '~/components/user/Avatar.vue'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'openLogin'): void
}>()

const closeModal = () => {
  emit('update:modelValue', false)
}

const openLogin = () => {
  closeModal()
  emit('openLogin')
}

const formState = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  displayName: '',
  position: '',
  avatar: ''
})

const { email, password, confirmPassword, displayName, position, avatar } = toRefs(formState)

const error = ref('')
const loading = ref(false)

const handleRegister = async () => {
  error.value = ''
  loading.value = true
  
  try {
    if (password.value !== confirmPassword.value) {
      error.value = t('common.passwordsDoNotMatch')
      toast.add({
        title: t('common.error'),
        description: t('common.passwordsDoNotMatch'),
        color: 'error'
      })
      return
    }

    const user = await createUserWithEmailAndPassword(formState.email, formState.password)
    if (!user) {
      error.value = t('common.registerError')
      toast.add({
        title: t('common.error'),
        description: t('common.registerError'),
        color: 'error'
      })
      return
    }
    
    // Добавляем дополнительные данные пользователя
    const userData = {
      id: user.id,
      email: user.email,
      displayName: formState.displayName,
      position: formState.position,
      avatar: formState.avatar,
      emailVerified: user.emailVerified,
      contacts: {
        email: user.email
      }
    }

    // Обновляем профиль пользователя через API
    try {
      const response = await $fetch(`/api/user/${user.id}/profile`, {
        method: 'POST',
        body: userData
      })
      
      // Сохраняем обновленные данные пользователя
      await storeUserAndRedirect(response.profile)
    } catch (err) {
      console.error('Error updating profile:', err)
      error.value = t('common.profileUpdateError')
      toast.add({
        title: t('common.error'),
        description: t('common.profileUpdateError'),
        color: 'error'
      })
      return
    }

    toast.add({
      title: t('common.success'),
      description: t('common.registerSuccess'),
      color: 'success'
    })
    closeModal()
  } catch (err) {
    error.value = t('common.unexpectedError')
    toast.add({
      title: t('common.error'),
      description: t('common.unexpectedError'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
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
    avatar.value = base64

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
</script>
