'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { UserSearch } from '@/components/user-search';
import { UserCard } from '@/components/user/UserCard';
import { UserFullProfile } from '@/components/user/UserFullProfile';
import { UserAvatar } from '@/components/user/UserAvatar';

export default function BlacklistPage() {
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<User[]>([]);
  const [showAllSelected, setShowAllSelected] = useState(false);

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
    setSelectedUsersToAdd(users);
  };

  const handleConfirmAddUsers = async () => {
    try {
      setError(null);
      
      // Фильтруем текущего пользователя из списка
      const filteredUsers = selectedUsersToAdd.filter(user => user.uid !== currentUserId);
      
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
      setSelectedUsersToAdd([]);
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
      setSelectedUser(null);
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
              selectedUsers={selectedUsersToAdd}
              maxUsers={10}
              placeholder="Search users to add to blacklist..."
              excludeUsers={[...selectedUsersToAdd.map(u => u.uid), currentUserId].filter(Boolean) as string[]}
            />
            {selectedUsersToAdd.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Selected Users:</span>
                    <div className="flex -space-x-2">
                      {selectedUsersToAdd.slice(0, 5).map((user) => (
                        <div key={user.uid} className="relative group">
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {user.displayName || user.email || 'Unknown User'}
                          </div>
                          <div className="border-2 border-white rounded-full">
                            <UserAvatar user={user} size="sm" />
                          </div>
                        </div>
                      ))}
                      {selectedUsersToAdd.length > 5 && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border-2 border-white text-sm font-medium">
                          +{selectedUsersToAdd.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedUsersToAdd.length > 5 && (
                      <Button
                        variant="light"
                        size="sm"
                        onPress={() => setShowAllSelected(!showAllSelected)}
                      >
                        {showAllSelected ? 'Show Less' : 'Show All'}
                      </Button>
                    )}
                    <Button
                      color="primary"
                      onPress={handleConfirmAddUsers}
                    >
                      Add Selected ({selectedUsersToAdd.length})
                    </Button>
                  </div>
                </div>
                {showAllSelected && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {selectedUsersToAdd.map((user) => (
                      <div key={user.uid} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <UserAvatar user={user} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.displayName || user.email || 'Unknown User'}
                          </p>
                        </div>
                        <Button
                          variant="light"
                          size="sm"
                          onPress={() => handleAddUsers(selectedUsersToAdd.filter(u => u.uid !== user.uid))}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onSelect={() => setSelectedUser(user)}
                isSelected={selectedUser?.uid === user.uid}
              />
            ))
          )}
        </div>

        {selectedUser && (
          <div className="sticky top-4">
            <UserFullProfile
              user={selectedUser}
              isBlocked={true}
              onUnblock={handleUnblock}
            />
          </div>
        )}
      </div>
    </div>
  );
} 