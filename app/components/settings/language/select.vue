<script setup>
const { locales, setLocale, locale: currentLocale } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])
const modalRef = ref(null)
const closeOnClickOutside = (event) => {
  if (modalRef.value && 
      !modalRef.value.contains(event.target) && 
      !event.target.closest('[data-language-button]')) {
    emit('update:modelValue', false)
  }
}

const closeOnEsc = (event) => {
  if (event.key === 'Escape') {
    emit('update:modelValue', false)
  }
}

onMounted(() => {
  document.addEventListener('click', closeOnClickOutside)
  document.addEventListener('keydown', closeOnEsc)
})

onUnmounted(() => {
  document.removeEventListener('click', closeOnClickOutside)
  document.removeEventListener('keydown', closeOnEsc)
})

const closeModal = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <div>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div v-if="props.modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-16">
          <div
            class="fixed inset-0 bg-black/50"
            @click="closeModal"
          />

          <div
            ref="modalRef"
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto"
          >
            <button
              class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              @click="closeModal"
            >
              <UIcon name="i-lucide-x" class="w-6 h-6" />
            </button>

            <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white pr-8">
              {{ $t('common.selectLanguage') }}
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <UButton
                v-for="item in locales"
                
                :key="item.code"
                :color="item.code === currentLocale ? 'primary' : 'gray'"
                :variant="item.code === currentLocale ? 'solid' : 'ghost'"
                class="flex items-center justify-center gap-2 p-4"
                @click="setLocale(item.code)"
              >
                <UIcon :name="item.icon" class="text-2xl" />
                <span class="font-medium">{{ item.name }}</span>
              </UButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>