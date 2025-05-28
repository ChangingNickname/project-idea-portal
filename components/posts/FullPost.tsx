'use client';
import { useEffect, useState } from 'react';
import { Post } from '../../types/posts';
import { UserAvatar } from '../user/UserAvatar';
import { PostModal } from '../create_form/PostModal';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { addToast } from '@heroui/toast';
import ReactMarkdown from 'react-markdown';
import { getAuth } from 'firebase/auth';
import Image from 'next/image';

interface FullPostProps {
  post: Post;
  onDelete?: (id: string) => void;
}

export function FullPost({ post, onDelete }: FullPostProps) {
  const [author, setAuthor] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);

  useEffect(() => {
    // Получаем текущего пользователя
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(user => {
      setIsAuthor(user?.uid === post.authorId);
    });
    return () => unsubscribe();
  }, [post.authorId]);

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот пост?')) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка при удалении');
      addToast({ title: 'Пост удалён', color: 'success' });
      if (onDelete) onDelete(post.id);
    } catch (err) {
      addToast({ title: 'Ошибка', description: (err as Error).message, color: 'danger' });
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto px-4 py-10 bg-white dark:bg-gray-900 rounded shadow flex flex-col">
      {isAuthor && (
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <Button size="sm" color="primary" onClick={() => setEditOpen(true)}>
            ✏️
          </Button>
          <Button size="sm" color="danger" onClick={handleDelete}>
            🗑️
          </Button>
        </div>
      )}
      {post.image && (
        <div className="relative w-full h-64 mb-6">
          <Image
            src={post.image}
            alt={post.name || 'Post image'}
            fill
            className="object-cover rounded"
          />
        </div>
      )}
      <h1 className="text-3xl font-bold mb-2">{post.name}</h1>
      <div className="flex items-center gap-3 mb-4">
        <UserAvatar user={author || {displayName: '', photoURL: null, email: post.email || '', isAnonymous: false}} size="sm" />
        <span className="text-gray-700 dark:text-gray-300 text-sm">{post.email || post.authorId}</span>
        <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
        <span className="text-xs text-gray-500">{post.status}</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {post.tags && post.tags.map((tag, i) => (
          <Chip
            key={i}
            variant="bordered"
            color="primary"
            size="sm"
          >
            {tag}
          </Chip>
        ))}
      </div>
      <div className="mb-6 prose dark:prose-invert max-w-none">
        <ReactMarkdown>{post.fullDesc}</ReactMarkdown>
      </div>
      {isAuthor && (
        <PostModal
          key={post.id + String(editOpen)}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          initialData={post}
          isEdit={true}
        />
      )}
    </div>
  );
} 