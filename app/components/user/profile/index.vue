<template>
  <div class="rounded-lg shadow-lg overflow-hidden">
    <div class="p-6">
      <div class="flex flex-col gap-6">
        <!-- User header -->
        <div class="flex items-center gap-4">
          <Avatar
            :src="user.avatar || undefined"
            :email="user.email || undefined"
            :alt="user.displayName || 'User avatar'"
            :isActive="user.emailVerified"
            size="xl"
          />
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ user.displayName || t('common.anonymousUser') }}
              </h1>
              <Icon 
                v-if="user.emailVerified" 
                name="heroicons:check-badge" 
                class="w-5 h-5 text-primary"
              />
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ user.position || t('common.noPositionProvided') }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ user.email || t('common.noEmailProvided') }}
            </p>
          </div>
        </div>

        <!-- User info -->
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="space-y-1">
            <p class="text-gray-500 dark:text-gray-400">{{ t('common.accountStatus') }}</p>
            <p :class="[
              'font-medium',
              user.disabled ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'
            ]">
              {{ user.disabled ? t('common.disabled') : t('common.active') }}
            </p>
          </div>
          <div class="space-y-1">
            <p class="text-gray-500 dark:text-gray-400">{{ t('common.accountType') }}</p>
            <p :class="[
              'font-medium',
              user.isAnonymous ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'
            ]">
              {{ user.isAnonymous ? t('common.anonymous') : t('common.registered') }}
            </p>
          </div>
          <div class="space-y-1">
            <p class="text-gray-500 dark:text-gray-400">{{ t('common.phone') }}</p>
            <p :class="[
              'font-medium',
              !user.contacts?.phone ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'
            ]">
              {{ user.contacts?.phone || t('common.notProvided') }}
            </p>
          </div>
          <div class="space-y-1">
            <p class="text-gray-500 dark:text-gray-400">{{ t('common.memberSince') }}</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatDate(user.metadata?.creationTime || null) }}
            </p>
          </div>
        </div>

        <!-- Contacts -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('common.contacts') }}</h2>
            <div v-if="!hasContacts" class="text-sm text-red-500 dark:text-red-400">
              {{ t('common.noContactsProvided') }}
            </div>
          </div>
          
          <div v-if="hasContacts" class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <a v-if="user.email" 
               :href="`mailto:${user.email}`"
               class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Icon name="heroicons:envelope" class="w-5 h-5 text-gray-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ user.email }}</span>
            </a>
            
            
            <a v-if="user.contacts?.telegram" 
               :href="`https://t.me/${user.contacts.telegram}`"
               target="_blank"
               class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Icon name="logos:telegram" class="w-5 h-5" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ user.contacts.telegram }}</span>
            </a>
            
            <a v-if="user.contacts?.whatsapp" 
               :href="`https://wa.me/${user.contacts.whatsapp}`"
               target="_blank"
               class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Icon name="logos:whatsapp-icon" class="w-5 h-5" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ user.contacts.whatsapp }}</span>
            </a>
            
            <a v-if="user.contacts?.viber" 
               :href="`viber://chat?number=${user.contacts.viber}`"
               class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Icon name="logos:viber" class="w-5 h-5" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ user.contacts.viber }}</span>
            </a>
            
            <a v-if="user.contacts?.discord" 
               :href="`https://discord.com/users/${user.contacts.discord}`"
               target="_blank"
               class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Icon name="logos:discord-icon" class="w-5 h-5" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ user.contacts.discord }}</span>
            </a>
            
            <a v-if="user.contacts?.linkedin" 
               :href="`https://linkedin.com/in/${user.contacts.linkedin}`"
               target="_blank"
               class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Icon name="logos:linkedin-icon" class="w-5 h-5" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ user.contacts.linkedin }}</span>
            </a>
            
            <a v-if="user.contacts?.github" 
               :href="`https://github.com/${user.contacts.github}`"
               target="_blank"
               class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Icon name="logos:github-icon" class="w-5 h-5" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ user.contacts.github }}</span>
            </a>
            
            <a v-if="user.contacts?.website" 
               :href="user.contacts.website"
               target="_blank"
               class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Icon name="heroicons:globe-alt" class="w-5 h-5 text-gray-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ user.contacts.website }}</span>
            </a>
          </div>
        </div>

        <!-- Provider info -->
        <div v-if="user.providerData?.length" class="space-y-2">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Connected Accounts</h2>
          <div class="flex flex-wrap gap-2">
            <div v-for="provider in user.providerData" 
                 :key="provider.providerId"
                 class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Icon :name="getProviderIcon(provider.providerId)" class="w-4 h-4" />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ formatProviderName(provider.providerId) }}
              </span>
            </div>
          </div>
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

const { t } = useI18n()

const hasContacts = computed(() => {
  if (!props.user.contacts) return !!props.user.email
  return props.user.email || 
         props.user.contacts.telegram || 
         props.user.contacts.whatsapp || 
         props.user.contacts.viber || 
         props.user.contacts.discord || 
         props.user.contacts.linkedin || 
         props.user.contacts.github || 
         props.user.contacts.website
})

const formatDate = (date: string | null) => {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getProviderIcon = (providerId: string) => {
  const icons: Record<string, string> = {
    'google.com': 'logos:google-icon',
    'facebook.com': 'logos:facebook',
    'github.com': 'logos:github-icon',
    'twitter.com': 'logos:twitter',
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
</script>
