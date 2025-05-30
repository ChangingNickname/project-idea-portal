export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  isAnonymous: boolean
  metadata: {
    creationTime: string | null
    lastSignInTime: string | null
  }
}

export interface AuthResponse {
  user: import('firebase/auth').User | null
  error: Error | null
} 