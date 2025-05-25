'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/firebase/auth';
import { Button } from "@heroui/button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { UserAvatar } from '@/components/user/UserAvatar';

interface StoredUser {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  isAnonymous: boolean;
}

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    };

    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  if (!user) {
    return (
      <Button
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

  const menuItems = [
    {
      key: 'user-info',
      content: (
        <div className="flex flex-col items-start gap-1 p-4">
          <span className="text-sm font-semibold">Signed in as</span>
          <span className="text-sm font-semibold">{displayName}</span>
          {user.isAnonymous && (
            <span className="text-xs text-default-500">Anonymous Account</span>
          )}
        </div>
      )
    },
    ...(!user.isAnonymous ? [
      {
        key: 'profile',
        content: 'My Profile',
        onClick: () => router.push('/profile')
      },
      {
        key: 'chats',
        content: 'Chats',
        onClick: () => router.push('/chats')
      },
      {
        key: 'blacklist',
        content: 'Blacklist',
        onClick: () => router.push('/blacklist')
      }
    ] : []),
    {
      key: 'logout',
      content: 'Log Out',
      className: 'text-danger',
      color: 'danger' as const,
      onClick: handleLogout
    }
  ];

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          isIconOnly
          variant="light"
          className="w-8 h-8 rounded-full"
        >
          <UserAvatar user={user} size="sm" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="User menu">
        {menuItems.map((item) => (
          <DropdownItem
            key={item.key}
            className={item.className}
            color={item.color}
            onClick={item.onClick}
          >
            {item.content}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
} 