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
import { useRouter } from 'next/navigation';
import { Input } from '@heroui/input';
import { Modal } from '@heroui/modal';
import { UserCard } from '@/components/user/UserCard';

export default function ChatsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch('/api/user/me');
        if (!response.ok) {
          throw new Error('Unauthorized');
        }
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setUserError('Unauthorized');
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    }
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    const fetchChats = async () => {
      try {
        const response = await fetch('/api/chat');
        if (response.ok) {
          const data = await response.json();
          setChats(data.chats);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
    const interval = setInterval(fetchChats, 30000);
    return () => clearInterval(interval);
  }, [user, userLoading, router]);

  const handleCreateChat = async () => {
    if (!selectedUsers.length || !user) return;
    setIsCreatingChat(true);
    setCreateError(null);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          members: selectedUsers.map(u => u.uid),
          message: 'Hello! 👋'
        }),
      });
      if (response.ok) {
        const newChat = await response.json();
        setChats(prev => [...prev, newChat]);
        setShowUserSearch(false);
        setSelectedUsers([]);
        const chatId = newChat.id || newChat.chat?.id;
        if (chatId) {
          router.push(`/chat/${chatId}`);
        } else {
          setCreateError('Failed to get chat id');
        }
      } else {
        const error = await response.json();
        setCreateError(error.error || 'Failed to create chat');
      }
    } catch (error) {
      setCreateError('Network error');
      console.error('Error creating chat:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.uid === user.uid);
      if (isSelected) {
        return prev.filter(u => u.uid !== user.uid);
      }
      return [...prev, user];
    });
  };

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (userError) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chats</h1>
        <Button
          color="primary"
          onPress={() => setShowUserSearch(true)}
        >
          New Chat
        </Button>
      </div>
      <div className="space-y-4 overflow-visible">
        {chats.map(chat => (
          <ChatCard
            key={chat.id}
            chat={chat}
            currentUser={user}
          />
        ))}
      </div>
      <Modal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        title="New Chat"
      >
        <div className="p-4 space-y-4">
          {createError && <div className="text-danger text-sm">{createError}</div>}
          <UserSearch
            onSelect={setSelectedUsers}
            selectedUsers={selectedUsers}
            excludeUsers={[user.uid]}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="light"
              onPress={() => setShowUserSearch(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              isLoading={isCreatingChat}
              isDisabled={!selectedUsers.length || isCreatingChat}
              onPress={handleCreateChat}
            >
              Create Chat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 