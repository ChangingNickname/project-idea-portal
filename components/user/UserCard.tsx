'use client';

import React from 'react';
import { User } from '@/types/user';
import { UserAvatar } from './UserAvatar';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { ExternalLinkIcon } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';

interface UserCardProps {
  user: User;
  isBlocked?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onBlock?: (user: User) => void;
  onUnblock?: (user: User) => void;
}

export function UserCard({ 
  user, 
  isBlocked = false,
  isSelected = false,
  onSelect,
  onBlock,
  onUnblock 
}: UserCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatUid = (uid: string) => {
    if (uid.length <= 8) return uid;
    return `${uid.slice(0, 4)}...${uid.slice(-4)}`;
  };

  const handleBlock = () => {
    if (onBlock) onBlock(user);
  };

  const handleUnblock = () => {
    if (onUnblock) onUnblock(user);
  };

  const handleViewProfile = () => {
    router.push(`/profile/${user.uid}`);
  };

  return (
    <Card className="relative">
      <Button
        isIconOnly
        variant="light"
        onPress={handleViewProfile}
        title="View Profile"
        className="absolute top-2 right-2 z-10"
      >
        <ExternalLinkIcon className="w-4 h-4" />
      </Button>
      <CardBody className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="lg" />
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">
              {user.displayName || user.email || 'User'}
            </h3>
            {user.email && (
              <div className="flex items-center gap-2">
                <p className="text-default-500 text-sm">{user.email}</p>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => user.email && handleCopy(user.email)}
                  title="Copy email"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <p className="text-default-500 text-sm font-mono">{formatUid(user.uid)}</p>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => handleCopy(user.uid)}
                title="Copy UID"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isBlocked ? (
            <Button
              color="danger"
              variant="light"
              onPress={handleUnblock}
            >
              Unblock
            </Button>
          ) : onBlock ? (
            <Button
              color="danger"
              onPress={handleBlock}
            >
              Block
            </Button>
          ) : onSelect ? (
            <Button
              color={isSelected ? "primary" : "default"}
              variant={isSelected ? "solid" : "light"}
              onPress={onSelect}
            >
              {isSelected ? 'Selected' : 'Select'}
            </Button>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
} 