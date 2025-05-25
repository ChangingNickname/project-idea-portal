'use client';

import { useEffect, useState } from 'react';
import { title } from '@/components/primitives';
import Image from 'next/image';
import Link from 'next/link';

import { Card } from "@heroui/card"; // Just the main Card component

type Post = {
  id: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  authorId: string;
  createdAt: string;
  status: 'Open' | 'Closed' | 'In Progress';
  tags: string[];
  image?: string;
};

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const response = await fetch('/api/posts', { cache: 'no-store' });
      const data = await response.json();
      setPosts(data);
    };

    fetchPosts();
  }, []);

  if (!Array.isArray(posts)) {
    console.error('Expected posts array but got:', posts);
    return <p className="text-red-500">⚠️ Failed to load posts.</p>;
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <h1 className={`${title()} text-3xl text-center mb-10`}>Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {posts.map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`} className="block">
            <Card className="p-0 hover:shadow-lg transition-shadow overflow-hidden">
              {post.image && (
                <div className="relative w-full h-48">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-lg font-semibold">{post.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{post.shortDesc}</p>
                <p className="text-xs text-gray-500 mt-2">Status: {post.status}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
