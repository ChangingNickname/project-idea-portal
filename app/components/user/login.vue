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
                  <h2 class="text-2xl font-bold">{{ $t('common.signIn') }}</h2>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-x-mark"
                    @click="closeModal"
                  />
                </div>
              </template>

              <UForm
                :state="{ email, password }"
                @submit="handleEmailLogin"
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
                  :label="$t('common.password')"
                  name="password"
                >
                  <UInput
                    v-model="password"
                    type="password"
                    :placeholder="$t('common.passwordInput')"
                    required
                    autocomplete="current-password"
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
                  {{ $t('common.signIn') }}
                </UButton>
              </UForm>

              <div class="relative my-6">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 text-gray-500 dark:text-gray-400">{{ $t('common.orContinueWith') }}</span>
                </div>
              </div>

              <UserAuthProviders
                :loading="loading"
                @provider="handleProviderLogin"
              />

              <template #footer>
                <div class="flex justify-center">
                  <UButton
                    variant="link"
                    class="text-sm text-primary-500 hover:text-primary-600"
                    @click="openRegister"
                  >
                    {{ $t('common.dontHaveAccount') }} <span class="underline">{{ $t('common.register') }}</span>
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
  signInWithEmail, 
  signInWithGoogle, 
  storeUserAndRedirect 
} from '~/utils/firebase/auth'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'openRegister'): void
}>()

const closeModal = () => {
  emit('update:modelValue', false)
}

const openRegister = () => {
  closeModal()
  emit('openRegister')
}

const formState = reactive({
  email: '',
  password: ''
})

const { email, password } = toRefs(formState)

const error = ref('')
const loading = ref(false)

const handleEmailLogin = async () => {
  error.value = ''
  loading.value = true
  
  try {
    const user = await signInWithEmail(formState.email, formState.password)
    if (!user) {
      error.value = t('common.loginError')
      toast.add({
        title: t('common.error'),
        description: t('common.loginError'),
        color: 'error'
      })
      return
    }
    
    await storeUserAndRedirect(user)
    toast.add({
      title: t('common.success'),
      description: t('common.loginSuccess'),
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

const handleProviderLogin = async (provider: 'google') => {
  error.value = ''
  loading.value = true
  
  try {
    const user = await signInWithGoogle()
    if (!user) {
      error.value = t('common.googleLoginError')
      toast.add({
        title: t('common.error'),
        description: t('common.googleLoginError'),
        color: 'error'
      })
      return
    }
    
    await storeUserAndRedirect(user)
    toast.add({
      title: t('common.success'),
      description: t('common.googleLoginSuccess'),
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
</script>