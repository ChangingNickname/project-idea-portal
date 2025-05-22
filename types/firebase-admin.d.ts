declare module '@/lib/firebase/admin' {
  import { Auth } from 'firebase-admin/auth';
  import { Firestore } from 'firebase-admin/firestore';

  export const auth: Auth;
  export const db: Firestore;
} 