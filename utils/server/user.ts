import { db } from '@/lib/firebase/admin';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRecord = await db.collection('users').doc(uid).get();
    
    if (!userRecord.exists) {
      return null;
    }

    const userData = userRecord.data();
    return {
      uid: userRecord.id,
      email: userData?.email || null,
      displayName: userData?.displayName || null,
      photoURL: userData?.photoURL || null,
      isAnonymous: userData?.isAnonymous || false,
      metadata: {
        creationTime: userData?.metadata?.creationTime || '',
        lastSignInTime: userData?.metadata?.lastSignInTime || ''
      }
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
} 