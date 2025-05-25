import React, { useState } from 'react';
import type { PostComment } from '@/types/chat';
import { InputForm } from './InputForm';

interface CommentsProps {
  comment: PostComment;
}

export const Comments: React.FC<CommentsProps> = ({ comment }) => {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className="bg-content1 dark:bg-content1 rounded p-2 shadow-sm">
      <div className="text-xs text-gray-500 mb-1">{comment.author.displayName || comment.author.email}</div>
      <div className="text-sm mb-1">{comment.content}</div>
      <div className="text-xs text-gray-400 mb-2">{new Date(comment.createdAt).toLocaleString()}</div>
      <button
        className="text-xs text-primary hover:underline"
        onClick={() => setShowReply(v => !v)}
        type="button"
      >
        Ответить
      </button>
      {showReply && (
        <div className="mt-2">
          <InputForm onSubmit={() => {}} isLoading={false} />
        </div>
      )}
    </div>
  );
}; 