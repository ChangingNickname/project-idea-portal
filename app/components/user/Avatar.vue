<template>
  <div class="relative inline-block">
    <UAvatar
      :src="avatarSrc"
      :alt="alt || email || 'User avatar'"
      :size="size"
      :class="[
        'transition-all duration-200',
        isActive && 'ring-2 ring-primary ring-offset-2',
        isBlocked && 'opacity-50'
      ]"
    />
    <UChip
      v-if="chipText"
      :text="chipText"
      size="sm"
      class="absolute -top-1 -right-1"
    />
  </div>
</template>

<script setup lang="ts">
import { generateAvatarUrl } from '~/utils/avatar'

interface Props {
  src?: string | null
  email?: string | null
  alt?: string | null
  isActive?: boolean
  isBlocked?: boolean
  chipText?: string | number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  email: '',
  alt: 'User avatar',
  isActive: false,
  isBlocked: false,
  chipText: '',
  size: 'md'
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