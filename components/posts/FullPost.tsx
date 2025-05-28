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
import remarkGfm from 'remark-gfm';
import 'github-markdown-css';
import { Components } from 'react-markdown';

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

  const components: Components = {
    img: ({src, alt, ...props}) => (
      <Image
        src={src || ''}
        alt={alt || 'Post image'}
        width={500}
        height={300}
        className="rounded-lg my-4"
        {...props}
      />
    ),
    code: ({className, children, ...props}) => (
      <code className={`${className} bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded px-1 py-0.5`} {...props}>
        {children}
      </code>
    ),
    pre: ({children, ...props}) => (
      <pre className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg p-4 my-4 overflow-x-auto border border-gray-200 dark:border-gray-700" {...props}>
        {children}
      </pre>
    ),
    table: ({children, ...props}) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({children, ...props}) => (
      <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
        {children}
      </thead>
    ),
    tbody: ({children, ...props}) => (
      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700" {...props}>
        {children}
      </tbody>
    ),
    tr: ({children, ...props}) => (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" {...props}>
        {children}
      </tr>
    ),
    th: ({children, ...props}) => (
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800" {...props}>
        {children}
      </th>
    ),
    td: ({children, ...props}) => (
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </td>
    ),
    ul: ({children, ...props}) => (
      <ul className="list-disc list-inside my-4 space-y-2 text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </ul>
    ),
    ol: ({children, ...props}) => (
      <ol className="list-decimal list-inside my-4 space-y-2 text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </ol>
    ),
    li: ({children, ...props}) => (
      <li className="text-gray-900 dark:text-gray-100 marker:text-gray-500 dark:marker:text-gray-400" {...props}>
        {children}
      </li>
    ),
    blockquote: ({children, ...props}) => (
      <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 py-2 pr-4 rounded-r" {...props}>
        {children}
      </blockquote>
    ),
    hr: ({...props}) => (
      <hr className="my-8 border-gray-200 dark:border-gray-700" {...props} />
    ),
    h1: ({children, ...props}) => (
      <h1 className="text-4xl font-bold my-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2" {...props}>
        {children}
      </h1>
    ),
    h2: ({children, ...props}) => (
      <h2 className="text-3xl font-bold my-5 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2" {...props}>
        {children}
      </h2>
    ),
    h3: ({children, ...props}) => (
      <h3 className="text-2xl font-bold my-4 text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </h3>
    ),
    h4: ({children, ...props}) => (
      <h4 className="text-xl font-bold my-3 text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </h4>
    ),
    h5: ({children, ...props}) => (
      <h5 className="text-lg font-bold my-2 text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </h5>
    ),
    h6: ({children, ...props}) => (
      <h6 className="text-base font-bold my-2 text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </h6>
    ),
    p: ({children, ...props}) => (
      <p className="my-4 text-gray-900 dark:text-gray-100 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    a: ({children, href, ...props}) => (
      <a 
        href={href} 
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors" 
        target="_blank" 
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    strong: ({children, ...props}) => (
      <strong className="font-bold text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </strong>
    ),
    em: ({children, ...props}) => (
      <em className="italic text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </em>
    ),
    del: ({children, ...props}) => (
      <del className="line-through text-gray-500 dark:text-gray-400" {...props}>
        {children}
      </del>
    )
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
      <div className="mb-6 markdown-body dark:markdown-body-dark [&_.markdown-body]:bg-transparent [&_.markdown-body]:dark:bg-transparent">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {post.fullDesc}
        </ReactMarkdown>
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