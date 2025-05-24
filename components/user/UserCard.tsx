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
import { Avatar } from "@heroui/avatar";

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

  return (
    <Card>
      <CardBody className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="lg" />
          <div>
            <h3 className="text-lg font-semibold">
              {user.displayName || user.email || 'User'}
            </h3>
            {user.email && (
              <p className="text-default-500">{user.email}</p>
            )}
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