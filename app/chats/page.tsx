'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { Chat } from '@/types/chat';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { UserSearch } from '@/components/user-search';
import { ChatCard } from '@/components/chat/ChatCard';
import { UserAvatar } from '@/components/user/UserAvatar';

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [showAllSelected, setShowAllSelected] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user/me');
      if (!response.ok) throw new Error('Failed to fetch current user');
      const data = await response.json();
      setCurrentUser(data);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/chat');
      if (!response.ok) throw new Error('Failed to fetch chats');
      const data = await response.json();
      setChats(data.chats || []);
    } catch (err) {
      setError('Error loading chats');
      console.error('Chats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchChats();
  }, []);

  const handleAddUsers = async (users: User[]) => {
    setSelectedUsers(users);
  };

  const handleConfirmAddUsers = async () => {
    try {
      setError(null);
      
      // Фильтруем текущего пользователя из списка
      const filteredUsers = selectedUsers.filter(user => user.uid !== currentUser?.uid);
      
      if (filteredUsers.length === 0) {
        setError('You cannot create a chat with yourself');
        return;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          members: [...filteredUsers.map(u => u.uid), currentUser?.uid].filter(Boolean),
          message: 'Hello!'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create chat');
      }
      
      await fetchChats();
      setShowSearch(false);
      setSelectedUsers([]);
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

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chats</h1>
        <Button
          color="primary"
          onPress={() => setShowSearch(!showSearch)}
        >
          {showSearch ? 'Cancel' : 'New Chat'}
        </Button>
      </div>

      {error && (
        <div className="text-danger mb-4">{error}</div>
      )}

      {showSearch && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Create New Chat</h2>
          </CardHeader>
          <CardBody>
            <UserSearch
              onSelect={handleAddUsers}
              selectedUsers={selectedUsers}
              maxUsers={10}
              placeholder="Search users to start a chat..."
              excludeUsers={[...selectedUsers.map(u => u.uid), currentUser?.uid].filter(Boolean) as string[]}
            />
            {selectedUsers.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Selected Users:</span>
                    <div className="flex -space-x-2">
                      {selectedUsers.slice(0, 5).map((user) => (
                        <div key={user.uid} className="relative group">
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {user.displayName || user.email || 'Unknown User'}
                          </div>
                          <div className="border-2 border-white rounded-full">
                            <UserAvatar user={user} size="sm" />
                          </div>
                        </div>
                      ))}
                      {selectedUsers.length > 5 && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border-2 border-white text-sm font-medium">
                          +{selectedUsers.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedUsers.length > 5 && (
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
                      Create Chat with {selectedUsers.length} {selectedUsers.length === 1 ? 'User' : 'Users'}
                    </Button>
                  </div>
                </div>
                {showAllSelected && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {selectedUsers.map((user) => (
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
                          onPress={() => handleAddUsers(selectedUsers.filter(u => u.uid !== user.uid))}
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

      <div className="space-y-4">
        {chats.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8">
              <p className="text-default-500">No chats yet</p>
            </CardBody>
          </Card>
        ) : (
          chats.map((chat) => (
            <ChatCard
              key={chat.id}
              chat={chat}
              currentUser={currentUser!}
            />
          ))
        )}
      </div>
    </div>
  );
} 