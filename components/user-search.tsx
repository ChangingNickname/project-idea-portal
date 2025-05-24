'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/user';
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Checkbox } from "@heroui/checkbox";
import { Spinner } from "@heroui/spinner";
import { useDebounce } from '@/hooks/useDebounce';
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
  placeholder = 'Поиск пользователей...',
  excludeUsers = []
}) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  const searchUsers = useCallback(async (searchQuery: string, token: string | null = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (token) params.append('pageToken', token);
      
      const response = await fetch(`/api/user/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      const filteredUsers = data.users.filter((user: User) => !excludeUsers.includes(user.uid));
      setUsers(filteredUsers);
      setPageToken(data.pageToken);
    } catch (err) {
      setError('Ошибка при поиске пользователей');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [excludeUsers]);

  useEffect(() => {
    searchUsers(debouncedQuery);
  }, [debouncedQuery, searchUsers]);

  const handleUserSelect = (user: User) => {
    const isSelected = selectedUsers.some(u => u.uid === user.uid);
    let newSelectedUsers: User[];

    if (isSelected) {
      newSelectedUsers = selectedUsers.filter(u => u.uid !== user.uid);
    } else {
      if (selectedUsers.length >= maxUsers) {
        setError(`Можно выбрать не более ${maxUsers} пользователей`);
        return;
      }
      newSelectedUsers = [...selectedUsers, user];
    }

    onSelect(newSelectedUsers);
    setError(null);
  };

  const loadMore = () => {
    if (pageToken) {
      searchUsers(debouncedQuery, pageToken);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full"
      />

      {error && (
        <div className="text-danger text-sm">{error}</div>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : users.length > 0 ? (
          <>
            {users.map((user) => (
              <div key={user.uid} className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
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
            
            {pageToken && (
              <Button
                variant="light"
                className="w-full"
                onPress={loadMore}
              >
                Загрузить еще
              </Button>
            )}
          </>
        ) : (
          <div className="text-center text-default-500 py-4">
            {query ? 'Пользователи не найдены' : 'Начните поиск'}
          </div>
        )}
      </div>

      {selectedUsers.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">
            Выбрано пользователей: {selectedUsers.length}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user.uid}
                className="flex items-center gap-2 bg-default-100 px-2 py-1 rounded-full"
              >
                <UserCard user={user} />
                <Button
                  size="sm"
                  variant="light"
                  className="p-1"
                  onPress={() => handleUserSelect(user)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 