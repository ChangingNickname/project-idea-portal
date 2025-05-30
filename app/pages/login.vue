<template>
    <UserLogin
      v-model="showLoginModal"
      @open-register="openRegister"
    />
    <UserRegister
      v-model="showRegisterModal"
      @open-login="openLogin"
    />
</template>

<script setup lang="ts">
const showLoginModal = ref(true)
const showRegisterModal = ref(false)

const openRegister = () => {
    showLoginModal.value = false
    showRegisterModal.value = true
}

const openLogin = () => {
    showLoginModal.value = true
    showRegisterModal.value = false
}

</script>