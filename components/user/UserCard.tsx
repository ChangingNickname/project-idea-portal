import { UserAvatar } from './UserAvatar';
import { User } from '@/types/user';
import { useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from '@heroui/button';
import { Tooltip } from "@heroui/tooltip";

interface UserCardProps {
  user: User;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function formatUid(uid: string) {
  if (uid.length <= 8) return uid;
  return `${uid.slice(0, 4)}...${uid.slice(-4)}`;
}

export function UserCard({ user }: UserCardProps) {
  const [copied, setCopied] = useState<{ email?: boolean; uid?: boolean }>({});

  const handleCopy = (type: 'email' | 'uid', value: string) => {
    copyToClipboard(value);
    setCopied(prev => ({ ...prev, [type]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [type]: false })), 1500);
  };

  // Приведение типов для UserAvatar
  const avatarUser = {
    photoURL: user.photoURL ?? null,
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    isAnonymous: user.isAnonymous,
  };

  return (
    <Card className="w-full max-w-xs">
      <CardHeader className="flex flex-col items-center p-6">
        <UserAvatar user={avatarUser} size="lg" />
        {user.displayName && (
          <div className="font-semibold text-lg mt-2">{user.displayName}</div>
        )}
      </CardHeader>
      <CardBody className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 truncate">{user.email || <span className="italic">Нет email</span>}</span>
          {user.email && (
            <Tooltip content={copied.email ? 'Скопировано!' : 'Копировать email'}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy('email', user.email!)}
                className="p-1"
              >
                <span className="sr-only">Скопировать email</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Zm0 0v2a2 2 0 0 0 2 2h6"/></svg>
              </Button>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-mono">{formatUid(user.uid)}</span>
          <Tooltip content={copied.uid ? 'Скопировано!' : 'Копировать UID'}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy('uid', user.uid)}
              className="p-1"
            >
              <span className="sr-only">Скопировать UID</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Zm0 0v2a2 2 0 0 0 2 2h6"/></svg>
            </Button>
          </Tooltip>
        </div>
      </CardBody>
    </Card>
  );
} 