'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/firebase/auth';
import { Button } from "@heroui/button";

interface StoredUser {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  isAnonymous?: boolean;
}

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check localStorage on mount and when it changes
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        // Ensure menu is closed when user state changes
        setIsOpen(false);
      } else {
        setUser(null);
      }
    };

    // Initial check
    checkUser();

    // Listen for storage changes
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('user');
    setUser(null);
    setIsOpen(false);
    router.push('/login');
  };

  if (!user) {
    return (
      <Button
        color="primary"
        variant="flat"
        onClick={() => router.push('/login')}
      >
        Sign In
      </Button>
    );
  }

  const displayName = user.isAnonymous 
    ? 'Anonymous User'
    : user.displayName || user.email?.split('@')[0] || 'User';

  return (
    <div className="relative">
      <Button
        isIconOnly
        variant="light"
        className="w-8 h-8 rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={displayName}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <span className="text-lg font-semibold">
            {displayName[0].toUpperCase()}
          </span>
        )}
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-700">
              <p className="font-semibold">Signed in as</p>
              <p className="font-semibold">{displayName}</p>
              {user.isAnonymous && (
                <p className="text-xs text-gray-500 mt-1">Anonymous Account</p>
              )}
            </div>
            {!user.isAnonymous && (
              <>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/profile');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/blacklist');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Blacklist
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 