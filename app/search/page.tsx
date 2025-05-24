'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { useDebounce } from '@/hooks/useDebounce';
import { UserCard } from '@/components/user/UserCard';
import { UserFullProfile } from '@/components/user/UserFullProfile';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const debouncedQuery = useDebounce(query, 300);

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
    fetchBlockedUsers();
  }, []);

  const searchUsers = async (searchQuery: string, token: string | null = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (token) params.append('pageToken', token);
      
      const response = await fetch(`/api/user/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users);
      setPageToken(data.pageToken);
    } catch (err) {
      setError('Error searching users');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchUsers(debouncedQuery);
  }, [debouncedQuery]);

  const loadMore = () => {
    if (pageToken) {
      searchUsers(debouncedQuery, pageToken);
    }
  };

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
      setError('Error adding user to blacklist');
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
      setError('Error removing user from blacklist');
      console.error('Unblock user error:', err);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {error && (
        <div className="text-danger mb-4">{error}</div>
      )}

      {selectedUser ? (
        <div className="space-y-4">
          <Button
            variant="light"
            onPress={() => setSelectedUser(null)}
          >
            ← Back to results
          </Button>
          <UserFullProfile
            user={selectedUser}
            isBlocked={blockedUsers.has(selectedUser.uid)}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : users.length > 0 ? (
            <>
              {users.map((user) => (
                <UserCard
                  key={user.uid}
                  user={user}
                  isBlocked={blockedUsers.has(user.uid)}
                  onBlock={handleBlock}
                  onUnblock={handleUnblock}
                />
              ))}
              
              {pageToken && (
                <Button
                  variant="light"
                  className="w-full"
                  onPress={loadMore}
                >
                  Load more
                </Button>
              )}
            </>
          ) : (
            <Card>
              <CardBody className="text-center py-8">
                <p className="text-default-500">
                  {query ? 'No users found' : 'Start searching'}
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 