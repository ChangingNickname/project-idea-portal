import { UserAvatar } from '@/components/user/UserAvatar';
import { Message as MessageType, User } from '@/types/chat';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

interface MessageProps {
  message: MessageType;
  currentUser: User;
}

export function Message({ message, currentUser }: MessageProps) {
  const isCurrentUser = message.sender.uid === currentUser.uid;
  const unreadBy = message.reader_by_ids.filter(
    reader => reader.uid !== message.sender.uid && reader.uid !== currentUser.uid
  );

  return (
    <div className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <UserAvatar user={message.sender} size="sm" />
      
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {message.sender.displayName || message.sender.email}
          </span>
          <span className="text-xs text-gray-500">
            {format(new Date(message.createdAt), 'HH:mm', { locale: enUS })}
          </span>
        </div>

        <div className={`rounded-lg p-3 ${
          isCurrentUser 
            ? 'bg-primary text-white' 
            : 'bg-gray-100 dark:bg-content2 text-gray-900 dark:text-gray-100'
        }`}>
          <div
            className="prose max-w-full min-h-[32px] text-gray-900 dark:text-gray-100 break-words overflow-x-auto"
            style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
          >
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {unreadBy.length > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            Read by: {unreadBy.map(user => user.displayName || user.email).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
} 