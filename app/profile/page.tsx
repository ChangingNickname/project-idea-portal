'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StoredUser {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [router]);

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-content1 rounded-lg shadow-lg p-6">
        <div className="flex flex-col gap-3 mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-default-500">Your account information</p>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-default-500">Email</p>
            <p className="text-lg">{user.email}</p>
          </div>
          {user.displayName && (
            <div>
              <p className="text-sm font-medium text-default-500">Display Name</p>
              <p className="text-lg">{user.displayName}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-default-500">Account Created</p>
            <p className="text-lg">
              {user.metadata.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString()
                : 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-default-500">Last Sign In</p>
            <p className="text-lg">
              {user.metadata.lastSignInTime
                ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                : 'Unknown'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 