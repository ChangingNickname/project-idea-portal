'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { UserFullProfile } from '@/components/user/UserFullProfile';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{
    uid: string;
  }>;
}

export default function UserProfilePage({ params }: PageProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const resolvedParams = React.use(params);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/user/${resolvedParams.uid}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error('Failed to fetch user');
      }

      const userData = await response.json();
      console.log('API Response:', userData);

      if (!userData || !userData.uid) {
        throw new Error('Invalid user data received');
      }

      setUser(userData);
    } catch (err) {
      console.error('Fetch user error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await fetch('/api/blacklist');
      if (!response.ok) throw new Error('Failed to fetch blacklist');
      const data = await response.json();
      setBlockedUsers(new Set(data.blocked_users.map((u: User) => u.uid)));
    } catch (err) {
      console.error('Failed to fetch blacklist:', err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchBlockedUsers();
  }, [resolvedParams.uid]);

  const handleBlock = async (user: User) => {
    try {
      setError(null);
      const response = await fetch('/api/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [user.uid] })
      });

      if (!response.ok) throw new Error('Failed to add user to blacklist');
      
      setBlockedUsers(prev => {
        const next = new Set(prev);
        next.add(user.uid);
        return next;
      });
    } catch (err) {
      setError('Failed to block user');
      console.error('Block user error:', err);
    }
  };

  const handleUnblock = async (user: User) => {
    try {
      setError(null);
      const response = await fetch('/api/blacklist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [user.uid] })
      });

      if (!response.ok) throw new Error('Failed to remove user from blacklist');
      
      setBlockedUsers(prev => {
        const next = new Set(prev);
        next.delete(user.uid);
        return next;
      });
    } catch (err) {
      setError('Failed to unblock user');
      console.error('Unblock user error:', err);
    }
  };

  const handleStartChat = async (user: User) => {
    try {
      setError(null);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          members: [user.uid],
          message: 'Hello!'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create chat');
      }

      const data = await response.json();
      router.push(`/chat/${data.chat.id}`);
    } catch (err: any) {
      setError(err.message || 'Error creating chat');
      console.error('Create chat error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-danger mb-4">{error || 'User not found'}</p>
            <Button
              variant="light"
              onPress={() => router.back()}
            >
              Go Back
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="light"
          onPress={() => router.back()}
        >
          ← Go Back
        </Button>
      </div>

      <UserFullProfile
        user={user}
        isBlocked={blockedUsers.has(user.uid)}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onStartChat={handleStartChat}
      />
    </div>
  );
} 