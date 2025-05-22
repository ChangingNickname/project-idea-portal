'use client';

import { useEffect, useState } from 'react';
import { title } from '@/components/primitives';
import Image from 'next/image';
import Link from 'next/link';
import { Post } from '@/types/post';

interface AuthorInfo {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

function getShortName(displayName: string | null) {
  if (!displayName) return '';
  const parts = displayName.split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authors, setAuthors] = useState<Record<string, AuthorInfo>>({});

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/posts');
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch posts');
        }
        setPosts(data.data || []);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Кэш авторов: текущий пользователь из localStorage, остальные — заглушка
  useEffect(() => {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    let currentUser: AuthorInfo | null = null;
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      currentUser = {
        uid: parsed.uid,
        displayName: parsed.displayName,
        photoURL: parsed.photoURL,
      };
    }
    const newAuthors: Record<string, AuthorInfo> = {};
    posts.forEach(post => {
      if (currentUser && post.authorId === currentUser.uid) {
        newAuthors[post.authorId] = currentUser;
      } else if (!newAuthors[post.authorId]) {
        newAuthors[post.authorId] = {
          uid: post.authorId,
          displayName: null,
          photoURL: null,
        };
      }
    });
    setAuthors(newAuthors);
  }, [posts]);

  if (isLoading) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Loading Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen px-6 py-10">
        <h1 className={`${title()} text-3xl text-center mb-10`}>Community Projects</h1>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-gray-400 text-6xl mb-4">🚀</div>
          <h2 className="text-xl font-semibold mb-2">Be the First!</h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            There are no projects yet. You can be the first to create one and inspire others!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <h1 className={`${title()} text-3xl text-center mb-10`}>Community Projects</h1>
      <div className="flex flex-wrap gap-6 justify-center">
        {posts.map((post) => {
          const author = authors[post.authorId];
          return (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="flex flex-col w-64 bg-white rounded-lg shadow-sm border overflow-hidden min-h-[130px] hover:shadow-md transition"
            >
              <div className="flex flex-row items-center gap-4 p-4">
                <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 rounded">
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">No image</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-base font-semibold text-gray-800">
                    {post.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {author && author.photoURL ? (
                      <img src={author.photoURL} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-500">?</div>
                    )}
                    <span className="text-xs text-gray-500">
                      {author && author.displayName ? getShortName(author.displayName) : post.authorId}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 px-4 pb-4">
                {post.content.slice(0, 80)}
              </p>
              <div className="px-4 pb-4 flex flex-wrap gap-2">
                {post.tags && post.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="px-4 pb-4 mt-auto">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  post.status === 'Open' ? 'bg-green-100 text-green-800' :
                  post.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                  post.status === 'Closed' ? 'bg-gray-300 text-gray-700' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {post.status || 'Draft'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
