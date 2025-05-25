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
import { useAuth } from '@/hooks/useAuth';
import { UserCard } from '@/components/user/UserCard';

export default function ChatsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
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
    // Update chats every 30 seconds
    const interval = setInterval(fetchChats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleCreateChat = async () => {
    if (!selectedUsers.length || !user) return;

    setIsCreatingChat(true);
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
        // Navigate to the new chat
        router.push(`/chat/${newChat.id}`);
      }
    } catch (error) {
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

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
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

      <div className="space-y-4">
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
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <div className="space-y-2">
            {selectedUsers.map(user => (
              <UserCard
                key={user.uid}
                user={user}
                showActions={false}
                showCheckbox={false}
              />
            ))}
          </div>

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