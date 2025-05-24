import { User } from '@/types/user';
import { UserAvatar } from './UserAvatar';
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from '@heroui/button';
import { Tooltip } from "@heroui/tooltip";
import { useState } from 'react';

interface UserFullProfileProps {
  user: User;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function formatUid(uid: string) {
  if (uid.length <= 8) return uid;
  return `${uid.slice(0, 4)}...${uid.slice(-4)}`;
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'Not specified';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function UserFullProfile({ user }: UserFullProfileProps) {
  const [copied, setCopied] = useState<{ email?: boolean; uid?: boolean; phone?: boolean }>({});

  const handleCopy = (type: 'email' | 'uid' | 'phone', value: string) => {
    copyToClipboard(value);
    setCopied(prev => ({ ...prev, [type]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [type]: false })), 1500);
  };

  const avatarUser = {
    photoURL: user.photoURL ?? null,
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    isAnonymous: user.isAnonymous,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col items-center p-6">
          <UserAvatar user={avatarUser} size="lg" />
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold">{user.displayName || 'No name'}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-gray-600">{user.email || 'No email'}</span>
              {user.email && (
                <Tooltip content={copied.email ? 'Copied!' : 'Copy email'}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy('email', user.email!)}
                    className="p-1"
                  >
                    <span className="sr-only">Copy email</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Zm0 0v2a2 2 0 0 0 2 2h6"/></svg>
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">User ID</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono">{formatUid(user.uid)}</span>
                <Tooltip content={copied.uid ? 'Copied!' : 'Copy UID'}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy('uid', user.uid)}
                    className="p-1"
                  >
                    <span className="sr-only">Copy UID</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Zm0 0v2a2 2 0 0 0 2 2h6"/></svg>
                  </Button>
                </Tooltip>
              </div>
            </div>
            {user.phoneNumber && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span>{user.phoneNumber}</span>
                  <Tooltip content={copied.phone ? 'Copied!' : 'Copy phone'}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy('phone', user.phoneNumber!)}
                      className="p-1"
                    >
                      <span className="sr-only">Copy phone</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Zm0 0v2a2 2 0 0 0 2 2h6"/></svg>
                    </Button>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Metadata</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Creation Date</h4>
              <p className="mt-1">{formatDate(user.metadata.creationTime)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Last Sign In</h4>
              <p className="mt-1">{formatDate(user.metadata.lastSignInTime)}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {user.providerData.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Sign-in Methods</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {user.providerData.map((provider, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{provider.providerId}</h4>
                    {provider.email && (
                      <p className="text-sm text-gray-600">{provider.email}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Status</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Email Verification</h4>
              <p className="mt-1">
                {user.emailVerified ? (
                  <span className="text-green-600">Verified</span>
                ) : (
                  <span className="text-red-600">Not verified</span>
                )}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Account Status</h4>
              <p className="mt-1">
                {user.disabled ? (
                  <span className="text-red-600">Disabled</span>
                ) : (
                  <span className="text-green-600">Active</span>
                )}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 