import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously as firebaseSignInAnonymously,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  type User as FirebaseUser
} from 'firebase/auth'

const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000 // 10 минут
const MAX_REFRESH_RETRIES = 3
const RETRY_DELAY = 5000 // 5 секунд

let tokenRefreshTimer: NodeJS.Timeout | null = null
let refreshRetryCount = 0

export const mapFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || null,
  displayName: firebaseUser.displayName || null,
  avatar: firebaseUser.photoURL || null,
  position: null,
  emailVerified: firebaseUser.emailVerified,
  isAnonymous: firebaseUser.isAnonymous,
  disabled: false,
  providerData: firebaseUser.providerData.map(provider => ({
    providerId: provider.providerId,
    uid: provider.uid,
    displayName: provider.displayName || null,
    email: provider.email || null,
    phoneNumber: provider.phoneNumber || null,
    photoURL: provider.photoURL || null
  })),
  customClaims: null,
  metadata: {
    creationTime: firebaseUser.metadata.creationTime || null,
    lastSignInTime: firebaseUser.metadata.lastSignInTime || null
  },
  tenantId: null,
  multiFactor: null,
  contacts: {
    email: firebaseUser.email || null,
    phone: firebaseUser.phoneNumber || null,
    telegram: null,
    whatsapp: null,
    viber: null,
    discord: null,
    linkedin: null,
    github: null,
    website: null
  }
})

/**
 * Refresh user token with retry logic
 */
const refreshUserToken = async (): Promise<void> => {
  const { $auth } = useNuxtApp()
  const currentUser = $auth.currentUser

  if (!currentUser) {
    stopTokenRefresh()
    return
  }

  try {
    const token = await currentUser.getIdToken(true) // force refresh
    const user = mapFirebaseUser(currentUser)
    localStorage.setItem('user', JSON.stringify(user))
    
    // Сохраняем токен в куки с безопасными настройками
    document.cookie = `auth_token=${token}; path=/; max-age=${TOKEN_REFRESH_INTERVAL / 1000}; SameSite=Strict; Secure`
    
    // Сбрасываем счетчик попыток при успешном обновлении
    refreshRetryCount = 0
  } catch (error) {
    console.error('Ошибка обновления токена:', error)
    
    // Увеличиваем счетчик попыток
    refreshRetryCount++
    
    if (refreshRetryCount < MAX_REFRESH_RETRIES) {
      // Пробуем еще раз через RETRY_DELAY
      setTimeout(refreshUserToken, RETRY_DELAY)
    } else {
      // Если превысили лимит попыток, останавливаем обновление
      stopTokenRefresh()
      // Показываем уведомление пользователю
      const toast = useToast()
      toast.add({
        title: 'Ошибка авторизации',
        description: 'Не удалось обновить сессию. Пожалуйста, войдите снова.',
        color: 'error',
        icon: 'i-heroicons-exclamation-circle'
      })
      // Разлогиниваем пользователя
      await signOut()
    }
  }
}

/**
 * Start token refresh interval
 */
const startTokenRefresh = (): void => {
  if (tokenRefreshTimer) {
    stopTokenRefresh()
  }
  // Сбрасываем счетчик попыток при старте
  refreshRetryCount = 0
  // Запускаем обновление токена
  tokenRefreshTimer = setInterval(refreshUserToken, TOKEN_REFRESH_INTERVAL)
  // Сразу делаем первую попытку обновления
  refreshUserToken()
}

/**
 * Stop token refresh interval
 */
const stopTokenRefresh = (): void => {
  if (tokenRefreshTimer) {
    clearInterval(tokenRefreshTimer)
    tokenRefreshTimer = null
  }
  // Сбрасываем счетчик попыток
  refreshRetryCount = 0
}

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
  const { $auth } = useNuxtApp()
  try {
    const result = await signInWithEmailAndPassword($auth, email, password)
    const user = mapFirebaseUser(result.user)
    const token = await result.user.getIdToken()
    document.cookie = `auth_token=${token}; path=/; max-age=${TOKEN_REFRESH_INTERVAL / 1000}; SameSite=Strict`
    startTokenRefresh()
    return user
  } catch (error) {
    console.error('Ошибка входа с email:', error)
    return null
  }
}

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<User | null> => {
  const { $auth } = useNuxtApp()
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup($auth, provider)
    const user = mapFirebaseUser(result.user)
    const token = await result.user.getIdToken()
    document.cookie = `auth_token=${token}; path=/; max-age=${TOKEN_REFRESH_INTERVAL / 1000}; SameSite=Strict`
    startTokenRefresh()
    return user
  } catch (error) {
    console.error('Ошибка входа через Google:', error)
    return null
  }
}

/**
 * Sign in anonymously
 */
export const signInAnonymouslyUser = async (): Promise<User | null> => {
  const { $auth } = useNuxtApp()
  try {
    const result = await firebaseSignInAnonymously($auth)
    const user = mapFirebaseUser(result.user)
    const token = await result.user.getIdToken()
    document.cookie = `auth_token=${token}; path=/; max-age=${TOKEN_REFRESH_INTERVAL / 1000}; SameSite=Strict`
    startTokenRefresh()
    return user
  } catch (error) {
    console.error('Ошибка анонимного входа:', error)
    return null
  }
}

/**
 * Store user data and redirect
 */
export const storeUserAndRedirect = async (user: User, additionalData?: Partial<User>): Promise<User> => {
  const { $auth } = useNuxtApp()
  const router = useRouter()
  
  try {
    const token = await $auth.currentUser?.getIdToken()
    if (!token) {
      throw new Error('Пользователь не авторизован')
    }
    
    // Объединяем данные пользователя с дополнительными данными
    const updatedUser = {
      ...user,
      ...additionalData
    }
    
    localStorage.setItem('user', JSON.stringify(updatedUser))
    localStorage.setItem('auth_token', token)
    startTokenRefresh()
    await router.push('/')
  } catch (error) {
    console.error('Ошибка сохранения пользователя:', error)
    throw error
  }
  
  return user
}

/**
 * Check if user is already logged in
 */
export const checkStoredUser = (): User | null => {
  if (process.server) return null
  
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    startTokenRefresh()
    return JSON.parse(storedUser)
  }
  return null
}

/**
 * Sign out user
 */
export const signOut = async (): Promise<void> => {
  const { $auth } = useNuxtApp()
  try {
    await $auth.signOut()
    stopTokenRefresh()
    localStorage.removeItem('user')
    // Удаляем куки
    document.cookie = 'auth_token=; path=/; max-age=0'
  } catch (error) {
    console.error('Ошибка выхода:', error)
    throw error
  }
}

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
  const { $auth } = useNuxtApp()
  const firebaseUser = $auth.currentUser
  return firebaseUser ? mapFirebaseUser(firebaseUser) : null
}

/**
 * Listen to auth state changes
 */
export const onAuthStateChanged = (callback: (user: User | null) => void): () => void => {
  const { $auth } = useNuxtApp()
  return $auth.onAuthStateChanged((firebaseUser) => {
    if (firebaseUser) {
      startTokenRefresh()
      callback(mapFirebaseUser(firebaseUser))
    } else {
      stopTokenRefresh()
      callback(null)
    }
  })
}

export const createUserWithEmailAndPassword = async (email: string, password: string): Promise<User | null> => {
  const { $auth } = useNuxtApp()
  try {
    const userCredential = await firebaseCreateUserWithEmailAndPassword($auth, email, password)
    const user = userCredential.user ? mapFirebaseUser(userCredential.user) : null
    if (user) {
      const token = await userCredential.user.getIdToken()
      document.cookie = `auth_token=${token}; path=/; max-age=${TOKEN_REFRESH_INTERVAL / 1000}; SameSite=Strict`
      startTokenRefresh()
    }
    return user
  } catch (error) {
    console.error('Ошибка создания пользователя:', error)
    throw error
  }
}

// Удаляем функции для работы с заголовками, так как теперь используем куки
export const getAuthToken = (): string | null => {
  if (process.server) return null
  const cookies = document.cookie.split(';')
  const tokenCookie = cookies.find(c => c.trim().startsWith('auth_token='))
  if (!tokenCookie) return null
  const token = tokenCookie.split('=')[1]
  return token || null
} 