import { Card, CardBody } from '@heroui/card';
import { UserAvatar } from '@/components/user/UserAvatar';
import { User } from '@/types/user';
import { Chat } from '@/types/chat';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ChatCardProps {
  chat: Chat;
  currentUser: User;
}

export function ChatCard({ chat, currentUser }: ChatCardProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`/api/chat/${chat.id}/unread`);
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    // Обновляем счетчик каждые 30 секунд
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [chat.id]);

  const handleClick = () => {
    router.push(`/chat/${chat.id}`);
  };

  // Получаем других участников чата (кроме текущего пользователя)
  const otherMembers = chat.members.filter(member => member.uid !== currentUser.uid);

  // Формируем название чата
  const chatName = otherMembers.length === 1
    ? otherMembers[0].displayName || otherMembers[0].email || 'User'
    : otherMembers.map(member => member.displayName || member.email || 'User').join(', ');

  return (
    <Card 
      className="cursor-pointer hover:bg-default-100 transition-colors"
      onPress={handleClick}
    >
      <CardBody className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex -space-x-2">
              {otherMembers.slice(0, 3).map((member) => (
                <div key={member.uid} className="relative group">
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {member.displayName || member.email || 'Unknown User'}
                  </div>
                  <div className="border-2 border-white rounded-full">
                    <UserAvatar user={member} size="sm" />
                  </div>
                </div>
              ))}
              {otherMembers.length > 3 && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border-2 border-white text-sm font-medium">
                  +{otherMembers.length - 3}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold truncate max-w-[200px]">
              {chatName}
            </h3>
            <p className="text-default-500 text-sm">
              {otherMembers.length} {otherMembers.length === 1 ? 'participant' : 'participants'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm font-medium">
            {unreadCount}
          </div>
        )}
      </CardBody>
    </Card>
  );
} 