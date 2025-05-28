import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@heroui/card';
import { UserAvatar } from '../user/UserAvatar';
import { useEffect, useState } from 'react';
import { getUserProfileById } from '../../utils/client/user';
import { Post } from '../../types/posts';
import { Button } from '@heroui/button';
import { addToast } from '@heroui/toast';
import { useRouter } from 'next/navigation';

const STORAGE_KEYS = {
  title: 'article-builder-title',
  tags: 'article-builder-tags',
  shortDesc: 'article-builder-short-desc',
  image: 'article-builder-image',
  content: 'article-builder-content',
  postId: 'article-builder-post-id'
};

type CardPostProps = {
  post: Post;
  editable?: boolean;
  onDelete?: (id: string) => void;
};

export function CardPost({ post, editable, onDelete }: CardPostProps) {
  const [author, setAuthor] = useState<{
    photoURL: string | null;
    displayName: string | null;
    email: string | null;
    isAnonymous: boolean;
  } | null>(null);
  const router = useRouter();
  const isDraft = post.status === 'draft';

  useEffect(() => {
    let ignore = false;
    getUserProfileById(post.authorId).then((user) => {
      if (!ignore && user) {
        setAuthor({
          photoURL: user.photoURL,
          displayName: user.displayName,
          email: user.email,
          isAnonymous: user.isAnonymous,
        });
      }
    });
    return () => { ignore = true; };
  }, [post.authorId]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
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

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    // Save only post id to localStorage
    localStorage.setItem('article-builder-post-id', post.id);
    // Redirect to article builder
    router.push('/articlebuilder');
  };

  return (
    <div className="relative block flex-1 min-w-[280px] max-w-[400px] min-h-[320px] max-h-[480px]">
      <Link href={`/posts/${post.id}`} className={`block h-full ${isDraft ? 'pointer-events-none' : ''}`}>
        <Card className={`p-0 hover:shadow-lg transition-shadow overflow-hidden h-full flex flex-col relative ${isDraft ? 'opacity-60' : ''}`}>
          {isDraft && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className="text-4xl font-bold text-red-500 transform -rotate-45 bg-white/90 px-8 py-4 rounded-lg shadow-lg">
                DRAFT
              </span>
            </div>
          )}
          {post.image && (
            <div className="relative w-full h-48">
              <Image
                src={post.image}
                alt={post.name ? post.name : 'Post image'}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-4 flex-1 flex flex-col">
            <h2 className="text-lg font-semibold">{post.name}</h2>
            <p className="text-sm text-gray-600 mt-1 flex-1">{post.shortDesc}</p>
            <p className="text-xs text-gray-500 mt-2">Status: {post.status}</p>
            <p className="text-xs text-gray-500 mt-1">Created: {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'N/A'}</p>
            <div className="flex items-center gap-2 mt-4">
              {author ? (
                <>
                  <UserAvatar user={author} size="sm" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{author.displayName || 'Anonymous'}</span>
                </>
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        </Card>
      </Link>
      {editable && (
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          <Button size="sm" color="primary" onClick={handleEdit}>
            ✏️
          </Button>
          <Button size="sm" color="danger" onClick={handleDelete}>
            🗑️
          </Button>
        </div>
      )}
    </div>
  );
} 