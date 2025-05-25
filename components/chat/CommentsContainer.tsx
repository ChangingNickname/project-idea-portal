import React from 'react';
import type { PostComment } from '@/types/chat';
import { Comments } from './Comments';

interface CommentsContainerProps {
  comments: PostComment[];
}

export const CommentsContainer: React.FC<CommentsContainerProps> = ({ comments }) => {
  if (!comments || comments.length === 0) {
    return <div className="text-gray-400 text-sm">Нет комментариев</div>;
  }

  return (
    <div className="space-y-2 mt-2">
      {comments.map(comment => (
        <Comments key={comment.id} comment={comment} />
      ))}
    </div>
  );
}; 