'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Message } from '@/components/chat/Message';
import { InputForm } from '@/components/chat/InputForm';
import { UserCard } from '@/components/user/UserCard';
import { Modal } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Chat, Message as MessageType, User } from '@/types/chat';
import { useAuth } from '@/hooks/useAuth';

export default function ChatPage() {
  const params = useParams();
  const { user } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const response = await fetch(`/api/chat/${params.chatId}`);
        if (response.ok) {
          const data = await response.json();
          setChat(data);
        }
      } catch (error) {
        console.error('Error fetching chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChat();
    // Update chat every 5 seconds
    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [params.chatId]);

  const handleSendMessage = async (content: string) => {
    if (!chat || !user) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/chat/${chat.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setChat(prev => prev ? {
          ...prev,
          messages: [...prev.messages, newMessage]
        } : null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || !chat || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Main chat content */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="border-b p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {chat.members.length === 2
              ? chat.members.find(m => m.uid !== user.uid)?.displayName || 'Chat'
              : 'Group Chat'}
          </h1>
          <Button
            variant="light"
            onPress={() => setShowMembers(true)}
          >
            Members ({chat.members.length})
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col-reverse overflow-y-auto p-4 space-y-4">
          {chat.messages.map((message: MessageType) => (
            <Message
              key={message.id}
              message={message}
              currentUser={user}
            />
          ))}
        </div>

        {/* Input form */}
        <div className="border-t p-4">
          <InputForm
            onSubmit={handleSendMessage}
            isLoading={isSending}
          />
        </div>
      </div>

      {/* Members modal */}
      <Modal
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        title="Chat Members"
      >
        <div className="p-4 space-y-2">
          {chat.members.map((member: User) => (
            <UserCard
              key={member.uid}
              user={member}
              showActions={false}
            />
          ))}
        </div>
      </Modal>
    </div>
  );
} 