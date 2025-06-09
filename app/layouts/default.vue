<template>
    <div class="flex flex-col min-h-screen">
        <CommonHeaders />
        <div class="w-full h-1 bg-primary-500 dark:bg-primary-600"/>
        <main class="flex-1">   
            <slot />
        </main>
        <!-- <div class="w-full h-1 bg-primary-500 dark:bg-primary-600"/> -->
        <!-- <CommonFooter /> -->
        <CommonFeedback />

        <!-- Auth Modals -->
        <UserLogin
            v-model="authStore.showLoginModal"
            @open-register="authStore.openRegister"
        />
        <UserRegister
            v-model="authStore.showRegisterModal"
            @open-login="authStore.openLogin"
        />
    </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'

// Initialize stores
const userStore = useUserStore()
const authStore = useAuthStore()

// Initialize store on client side only
onMounted(async () => {
    if (process.client) {
        await userStore.init()
    }
})
</script>