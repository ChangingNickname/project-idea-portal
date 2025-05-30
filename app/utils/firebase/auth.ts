import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously as firebaseSignInAnonymously,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  type User as FirebaseUser
} from 'firebase/auth'
import type { User } from '~/types/user'

const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000 // 10 minutes
let tokenRefreshTimer: NodeJS.Timeout | null = null

const mapFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email || null,
  displayName: firebaseUser.displayName || null,
  photoURL: firebaseUser.photoURL || null,
  emailVerified: firebaseUser.emailVerified,
  isAnonymous: firebaseUser.isAnonymous,
  metadata: {
    creationTime: firebaseUser.metadata.creationTime || null,
    lastSignInTime: firebaseUser.metadata.lastSignInTime || null
  }
})

/**
 * Refresh user token and update session
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
    
    // Update session cookie on server
    await $fetch('/api/auth/session', {
      method: 'POST',
      body: { token }
    })
  } catch (error) {
    console.error('Error refreshing token:', error)
    stopTokenRefresh()
  }
}

/**
 * Start token refresh interval
 */
const startTokenRefresh = (): void => {
  if (tokenRefreshTimer) {
    stopTokenRefresh()
  }
  tokenRefreshTimer = setInterval(refreshUserToken, TOKEN_REFRESH_INTERVAL)
}

/**
 * Stop token refresh interval
 */
const stopTokenRefresh = (): void => {
  if (tokenRefreshTimer) {
    clearInterval(tokenRefreshTimer)
    tokenRefreshTimer = null
  }
}

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
  const { $auth } = useNuxtApp()
  try {
    const result = await signInWithEmailAndPassword($auth, email, password)
    const user = mapFirebaseUser(result.user)
    startTokenRefresh()
    return user
  } catch (error) {
    console.error('Error signing in with email:', error)
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
    startTokenRefresh()
    return user
  } catch (error) {
    console.error('Error signing in with Google:', error)
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
    startTokenRefresh()
    return user
  } catch (error) {
    console.error('Error signing in anonymously:', error)
    return null
  }
}

/**
 * Store user data and create session
 */
export const storeUserAndRedirect = async (user: User): Promise<User> => {
  const { $auth } = useNuxtApp()
  const router = useRouter()
  
  try {
    const token = await $auth.currentUser?.getIdToken()
    if (!token) {
      throw new Error('No authenticated user found')
    }
    
    localStorage.setItem('user', JSON.stringify(user))
    startTokenRefresh()
    await router.push('/')
  } catch (error) {
    console.error('Error storing user:', error)
    throw error
  }
  
  return user
}

/**
 * Check if user is already logged in
 */
export const checkStoredUser = (): User | null => {
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
    // Call server logout endpoint first
    await $fetch('/api/auth/logout', {
      method: 'POST'
    })
    
    // Then sign out from Firebase
    await $auth.signOut()
    stopTokenRefresh()
    localStorage.removeItem('user')
  } catch (error) {
    console.error('Error signing out:', error)
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
    } else {
      stopTokenRefresh()
    }
    callback(firebaseUser ? mapFirebaseUser(firebaseUser) : null)
  })
}

export const createUserWithEmailAndPassword = async (email: string, password: string): Promise<User | null> => {
  const { $auth } = useNuxtApp()
  try {
    const userCredential = await firebaseCreateUserWithEmailAndPassword($auth, email, password)
    const user = userCredential.user ? mapFirebaseUser(userCredential.user) : null
    if (user) {
      startTokenRefresh()
    }
    return user
  } catch (error) {
    console.error('Error creating user with email:', error)
    throw error
  }
} 