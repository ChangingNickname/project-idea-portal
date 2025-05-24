'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { UserSearch } from '@/components/user-search';
import { UserCard } from '@/components/user/UserCard';

export default function BlacklistPage() {
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user/me');
      if (!response.ok) throw new Error('Failed to fetch current user');
      const data = await response.json();
      setCurrentUserId(data.uid);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };

  const fetchBlacklist = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/blacklist');
      if (!response.ok) throw new Error('Failed to fetch blacklist');
      const data = await response.json();
      setBlockedUsers(data.blocked_users || []);
    } catch (err) {
      setError('Error loading blacklist');
      console.error('Blacklist error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchBlacklist();
  }, []);

  const handleAddUsers = async (users: User[]) => {
    try {
      setError(null);
      
      // Фильтруем текущего пользователя из списка
      const filteredUsers = users.filter(user => user.uid !== currentUserId);
      
      if (filteredUsers.length === 0) {
        setError('You cannot add yourself to the blacklist');
        return;
      }

      const response = await fetch('/api/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: filteredUsers.map(u => u.uid) })
      });

      if (!response.ok) throw new Error('Failed to add users to blacklist');
      
      await fetchBlacklist();
      setShowSearch(false);
    } catch (err) {
      setError('Error adding users to blacklist');
      console.error('Add to blacklist error:', err);
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
      
      await fetchBlacklist();
    } catch (err) {
      setError('Error removing user from blacklist');
      console.error('Remove from blacklist error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Blacklist</h1>
        <Button
          color="primary"
          onPress={() => setShowSearch(!showSearch)}
        >
          {showSearch ? 'Cancel' : 'Add Users'}
        </Button>
      </div>

      {error && (
        <div className="text-danger mb-4">{error}</div>
      )}

      {showSearch && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Add Users</h2>
          </CardHeader>
          <CardBody>
            <UserSearch
              onSelect={handleAddUsers}
              maxUsers={10}
              placeholder="Search users to add to blacklist..."
              excludeUsers={[currentUserId].filter(Boolean) as string[]}
            />
          </CardBody>
        </Card>
      )}

      <div className="space-y-4">
        {blockedUsers.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8">
              <p className="text-default-500">Blacklist is empty</p>
            </CardBody>
          </Card>
        ) : (
          blockedUsers.map((user) => (
            <UserCard
              key={user.uid}
              user={user}
              isBlocked={true}
              onUnblock={handleUnblock}
            />
          ))
        )}
      </div>
    </div>
  );
} 