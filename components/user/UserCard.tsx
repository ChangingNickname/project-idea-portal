'use client';

import { User } from '@/types/user';
import { UserAvatar } from './UserAvatar';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { ExternalLinkIcon } from '@/components/icons';
import { useRouter } from 'next/navigation';

interface UserCardProps {
  user: User;
}

export const UserCard = ({ user }: UserCardProps) => {
  const router = useRouter();

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

  return (
    <Card>
      <CardBody className="relative">
        <Button
          isIconOnly
          variant="light"
          className="absolute top-2 right-2"
          onClick={() => router.push(`/profile/${user.uid}`)}
        >
          <ExternalLinkIcon className="text-default-500" />
        </Button>
        <div className="flex items-start gap-4">
          <UserAvatar user={user} size="lg" />
          <div className="flex-1">
            {user.displayName && (
              <h3 className="text-lg font-semibold mb-1">{user.displayName}</h3>
            )}
            {user.email && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-default-500">{user.email}</span>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onClick={() => handleCopy(user.email!)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
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
              <span className="text-default-500">{formatUid(user.uid)}</span>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onClick={() => handleCopy(user.uid)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
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
      </CardBody>
    </Card>
  );
}; 