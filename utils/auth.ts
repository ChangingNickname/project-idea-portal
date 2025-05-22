import { User } from 'firebase/auth';

export const setAuthToken = async (user: User) => {
  const token = await user.getIdToken();
  document.cookie = `firebase_token=${token}; path=/; max-age=3600; secure; samesite=strict`;
};

export const removeAuthToken = () => {
  document.cookie = 'firebase_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
};

export const getAuthToken = (): string | undefined => {
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('firebase_token='));
  return tokenCookie?.split('=')[1];
}; 