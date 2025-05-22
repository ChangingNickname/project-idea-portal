import { UserProfile } from '../server/user';

export async function getMyProfile(): Promise<UserProfile | null> {
  try {
    const response = await fetch('/api/user/me', {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching my profile:', error);
    return null;
  }
}

export async function getUserProfileById(id: string): Promise<UserProfile | null> {
  try {
    const response = await fetch(`/api/user/${id}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
} 