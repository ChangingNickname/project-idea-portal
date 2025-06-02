import { useUserStore } from '~/stores/user'

export default defineNuxtPlugin(async () => {
  if (process.server) return
 
  const userStore = useUserStore()
  await userStore.init()
}) 