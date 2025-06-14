<script setup>
import { subjectAreas } from '~/utils/subjectAreas'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  selectedAreas: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'update:selectedAreas'])

const modalRef = ref(null)
const selectedAreas = ref([])

// Initialize selected areas when props change
watch(() => props.selectedAreas, (newAreas) => {
  selectedAreas.value = [...newAreas]
}, { immediate: true })

// Group subject areas by category
const groupedAreas = computed(() => {
  return subjectAreas.reduce((groups, area) => {
    const category = area.category || 'other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(area)
    return groups
  }, {})
})

// Close modal when clicking outside
const closeOnClickOutside = (event) => {
  if (modalRef.value && 
      !modalRef.value.contains(event.target) && 
      !event.target.closest('[data-subject-area-button]')) {
    emit('update:modelValue', false)
  }
}

// Close modal on Escape key
const closeOnEsc = (event) => {
  if (event.key === 'Escape') {
    emit('update:modelValue', false)
  }
}

// Toggle selection of a subject area
const toggleArea = (area) => {
  if (!area || !area.key) return
  
  const index = selectedAreas.value.findIndex(a => a.key === area.key)
  if (index === -1) {
    selectedAreas.value.push({
      key: area.key,
      label: area.label,
      i18nKey: area.i18nKey
    })
  } else {
    selectedAreas.value.splice(index, 1)
  }
}

// Check if area is selected
const isAreaSelected = (area) => {
  if (!area || !area.key) return false
  return selectedAreas.value.some(a => a.key === area.key)
}

// Check if all children of a category are selected
const isCategorySelected = (category) => {
  if (!category || !category.children) return false
  return category.children.every(child => isAreaSelected(child))
}

// Toggle selection of a category
const toggleCategory = (category) => {
  if (!category || !category.children) return
  
  const allSelected = isCategorySelected(category)
  
  if (allSelected) {
    // Remove all children of this category
    selectedAreas.value = selectedAreas.value.filter(
      area => !category.children.some(child => child.key === area.key)
    )
  } else {
    // Add all children of this category
    category.children.forEach(child => {
      if (!isAreaSelected(child)) {
        selectedAreas.value.push({
          key: child.key,
          label: child.label,
          i18nKey: child.i18nKey
        })
      }
    })
  }
}

// Confirm selection and close modal
const confirmSelection = () => {
  emit('update:selectedAreas', selectedAreas.value)
  emit('update:modelValue', false)
}

// Close modal without saving
const closeModal = () => {
  selectedAreas.value = [...props.selectedAreas]
  emit('update:modelValue', false)
}

onMounted(() => {
  document.addEventListener('click', closeOnClickOutside)
  document.addEventListener('keydown', closeOnEsc)
})

onUnmounted(() => {
  document.removeEventListener('click', closeOnClickOutside)
  document.removeEventListener('keydown', closeOnEsc)
})
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
              {{ $t('common.selectSubjectAreas') }}
            </h2>

            <div class="space-y-8">
              <div v-for="category in subjectAreas" :key="category.key" class="space-y-4">
                <div 
                  class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg"
                  @click="toggleCategory(category)"
                >
                  <UIcon v-if="category.icon" :name="category.icon" class="text-xl" />
                  <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    {{ category.label }}
                  </h3>
                  <UIcon
                    v-if="isCategorySelected(category)"
                    name="i-lucide-check"
                    class="ml-auto text-sm"
                  />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div
                    v-for="area in category.children"
                    :key="area.key"
                    class="relative"
                  >
                    <UButton
                      :color="isAreaSelected(area) ? 'primary' : 'gray'"
                      :variant="isAreaSelected(area) ? 'solid' : 'ghost'"
                      class="w-full flex items-center justify-center gap-2 p-4"
                      @click.stop="toggleArea(area)"
                    >
                      <span class="font-medium">{{ area.label }}</span>
                      <UIcon
                        v-if="isAreaSelected(area)"
                        name="i-lucide-check"
                        class="absolute right-2 text-sm"
                      />
                    </UButton>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-4">
              <UButton
                color="gray"
                variant="ghost"
                @click="closeModal"
              >
                {{ $t('common.cancel') }}
              </UButton>
              <UButton
                color="primary"
                @click="confirmSelection"
              >
                {{ $t('common.confirm') }}
              </UButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
