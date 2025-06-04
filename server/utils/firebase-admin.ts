import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'

let app: App | undefined

if (!getApps().length) {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
} else {    
  app = getApps()[0]
}

export { app }
export const db = getFirestore(app as App)
export const auth = getAuth(app as App)

// Define AuthResult type
export interface AuthResult extends DecodedIdToken {
  uid: string
}
