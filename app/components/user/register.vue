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
                :state="{ email, password, confirmPassword }"
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
  confirmPassword: ''
})

const { email, password, confirmPassword } = toRefs(formState)

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
    
    await storeUserAndRedirect(user)
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
</script>
