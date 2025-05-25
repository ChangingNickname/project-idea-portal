'use client';

import { useEffect, useState } from 'react';
import { title } from '@/components/primitives';
import Image from 'next/image';
import Link from 'next/link';

import { Card } from "@heroui/card"; // Just the main Card component
import { PostContainer } from '@/components/posts/PostContainer';
import { Post } from '@/types/posts';

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initial load
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const response = await fetch('/api/posts?limit=3', { cache: 'no-store' });
      const data = await response.json();
      setPosts(data.posts);
      setPageToken(data.pageToken || null);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  // Load more posts
  const fetchMore = async () => {
    if (!pageToken) return;
    setLoading(true);
    const response = await fetch(`/api/posts?limit=3&pageToken=${pageToken}`, { cache: 'no-store' });
    const data = await response.json();
    const newPosts = data.posts.filter((newPost: Post) => !posts.some(existingPost => existingPost.id === newPost.id));
    setPosts(prev => [...prev, ...newPosts]);
    setPageToken(data.pageToken || null);
    setLoading(false);
  };

  if (!Array.isArray(posts)) {
    console.error('Expected posts array but got:', posts);
    return <p className="text-red-500">⚠️ Failed to load posts.</p>;
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <h1 className={`${title()} text-3xl text-center mb-10`}>Dashboard</h1>

      <PostContainer posts={posts} />
      {pageToken && (
        <div className="flex justify-center mt-8">
          <button
            className="px-6 py-2 rounded bg-primary text-primary-foreground hover:bg-primary-600 transition"
            onClick={fetchMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
