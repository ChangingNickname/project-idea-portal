import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut,
  User
} from 'firebase/auth';
import { firebaseConfig } from '@/config/firebase';
import { initializeApp } from 'firebase/app';
import { setAuthToken, removeAuthToken } from '@/utils/auth';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await setAuthToken(result.user);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await setAuthToken(result.user);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await setAuthToken(result.user);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const signInAnonymouslyUser = async () => {
  try {
    const result = await signInAnonymously(auth);
    await setAuthToken(result.user);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    removeAuthToken();
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
}; 