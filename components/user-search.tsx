'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@/types/user';
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Spinner } from "@heroui/spinner";
import { UserCard } from '@/components/user/UserCard';

interface UserSearchProps {
  onSelect: (users: User[]) => void;
  selectedUsers?: User[];
  maxUsers?: number;
  placeholder?: string;
  excludeUsers?: string[];
}

export const UserSearch: React.FC<UserSearchProps> = ({
  onSelect,
  selectedUsers = [],
  maxUsers = 10,
  placeholder = 'Search users...',
  excludeUsers = []
}) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const searchUsers = useCallback(async (searchQuery: string, token: string | null = null) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      setPageToken(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('q', searchQuery);
      if (token) params.append('pageToken', token);
      
      const response = await fetch(`/api/user/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      const filteredUsers = data.users.filter((user: User) => !excludeUsers.includes(user.uid));
      
      if (token) {
        setUsers(prev => [...prev, ...filteredUsers]);
      } else {
        setUsers(filteredUsers);
      }
      setPageToken(data.pageToken);
    } catch (err) {
      setError('Error searching users');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [excludeUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Очищаем предыдущий таймер
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Устанавливаем новый таймер
    if (newQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(newQuery);
      }, 1500);
    } else {
      setUsers([]);
      setPageToken(null);
    }
  };

  // Очищаем таймер при размонтировании
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleUserSelect = (user: User) => {
    const isSelected = selectedUsers.some(u => u.uid === user.uid);
    let newSelectedUsers: User[];

    if (isSelected) {
      newSelectedUsers = selectedUsers.filter(u => u.uid !== user.uid);
    } else {
      if (selectedUsers.length >= maxUsers) {
        setError(`You can select up to ${maxUsers} users`);
        return;
      }
      newSelectedUsers = [...selectedUsers, user];
    }

    onSelect(newSelectedUsers);
    setError(null);
  };

  const loadMore = () => {
    if (pageToken && query) {
      searchUsers(query, pageToken);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        className="w-full"
      />

      {error && (
        <div className="text-danger text-sm">{error}</div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : users.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {users.map((user) => (
                <div key={user.uid} className="relative">
                  <div className="absolute left-4 top-4 z-10">
                    <Checkbox
                      isSelected={selectedUsers.some(u => u.uid === user.uid)}
                      onValueChange={() => handleUserSelect(user)}
                    />
                  </div>
                  <div className="pl-12">
                    <UserCard user={user} />
                  </div>
                </div>
              ))}
            </div>
            
            {pageToken && (
              <Button
                variant="light"
                className="w-full"
                onPress={loadMore}
                isLoading={loading}
              >
                Load more
              </Button>
            )}
          </>
        ) : (
          <div className="text-center text-default-500 py-4">
            {query ? 'No users found' : 'Start typing to search'}
          </div>
        )}
      </div>
    </div>
  );
}; 