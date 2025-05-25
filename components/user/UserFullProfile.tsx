'use client';

import { User } from '@/types/user';
import { UserAvatar } from './UserAvatar';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { useState } from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';

interface UserFullProfileProps {
  user: User;
  isBlocked?: boolean;
  onBlock?: (user: User) => Promise<void>;
  onUnblock?: (user: User) => Promise<void>;
  onStartChat?: (user: User) => Promise<void>;
}

export const UserFullProfile = ({ user, isBlocked, onBlock, onUnblock, onStartChat }: UserFullProfileProps) => {
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleBlockAction = async () => {
    if (!onBlock || !onUnblock) return;
    
    try {
      setLoading(true);
      if (isBlocked) {
        await onUnblock(user);
      } else {
        await onBlock(user);
      }
    } catch (err) {
      console.error('Failed to update blacklist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!onStartChat) return;
    
    try {
      setChatLoading(true);
      await onStartChat(user);
    } catch (err) {
      console.error('Failed to start chat:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const avatarUser = {
    photoURL: user.photoURL ?? null,
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    isAnonymous: user.isAnonymous,
  };

  return (
    <Card>
      <CardBody className="space-y-6">
        {/* Basic Info */}
        <div className="flex items-start gap-4">
          <UserAvatar user={avatarUser} size="lg" />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                {user.displayName && (
                  <h2 className="text-2xl font-bold mb-2">{user.displayName}</h2>
                )}
                {user.email && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-default-500">{user.email}</span>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleCopy(user.email!)}
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
                  <span className="text-default-500 font-mono">{user.uid}</span>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => handleCopy(user.uid)}
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
              <div className="flex items-center gap-2">
                {onStartChat && (
                  <Button
                    color="primary"
                    isLoading={chatLoading}
                    isDisabled={isBlocked}
                    onPress={handleStartChat}
                  >
                    {isBlocked ? 'User Blocked' : 'Start Chat'}
                  </Button>
                )}
                {onBlock && onUnblock && (
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        variant="light"
                        className="p-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="User actions">
                      <DropdownItem
                        key="block"
                        color={isBlocked ? "danger" : "default"}
                        onPress={handleBlockAction}
                      >
                        {isBlocked ? 'Unblock User' : 'Block User'}
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Account Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-default-500">Created:</span>{' '}
                {formatDate(user.metadata.creationTime)}
              </div>
              <div>
                <span className="text-default-500">Last Sign In:</span>{' '}
                {formatDate(user.metadata.lastSignInTime)}
              </div>
              <div>
                <span className="text-default-500">Last Refresh:</span>{' '}
                {formatDate(user.metadata.lastRefreshTime)}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Account Status</h3>
            <div className="space-y-2">
              <div>
                <span className="text-default-500">Email Verified:</span>{' '}
                {user.emailVerified ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="text-default-500">Account Disabled:</span>{' '}
                {user.disabled ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="text-default-500">Anonymous:</span>{' '}
                {user.isAnonymous ? 'Yes' : 'No'}
              </div>
              {onBlock && onUnblock && (
                <div>
                  <span className="text-default-500">Blocked:</span>{' '}
                  {isBlocked ? 'Yes' : 'No'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Auth Providers */}
        {user.providerData.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Authentication Providers</h3>
            <div className="space-y-2">
              {user.providerData.map((provider, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-default-500">{provider.providerId}:</span>
                  {provider.email || provider.phoneNumber || provider.uid}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.phoneNumber && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Phone Number</h3>
              <div className="flex items-center gap-2">
                <span className="text-default-500">{user.phoneNumber}</span>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => handleCopy(user.phoneNumber!)}
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
          )}

          {user.multiFactor && user.multiFactor.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Multi-Factor Authentication</h3>
              <div className="space-y-2">
                {user.multiFactor.map((factor, index) => (
                  <div key={index}>
                    <span className="text-default-500">{factor.factorId}</span>
                    {factor.displayName && ` (${factor.displayName})`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}; 