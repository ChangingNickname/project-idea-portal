<template>
  <div class="relative inline-block">
    <UAvatar
      :src="avatarSrc"
      :alt="alt"
      :class="[
        'transition-all duration-200',
        isActive && 'ring-2 ring-primary ring-offset-2'
      ]"
    />
    <UChip
      v-if="chipText"
      :text="chipText"
      size="3xl"
      class="absolute -top-2 -right-2"
    />
  </div>
</template>

<script setup lang="ts">
import { generateAvatarUrl } from '~/utils/avatar'

interface Props {
  src?: string
  email?: string
  alt?: string
  isActive?: boolean
  chipText?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  email: '',
  alt: 'User avatar',
  isActive: false,
  chipText: ''
})

const avatarSrc = computed(() => {
  if (props.src) {
    return props.src
  }
  if (props.email) {
    return generateAvatarUrl(props.email)
  }
  // Fallback to a default avatar if neither src nor email is provided
  return generateAvatarUrl('default')
})
</script>