'use client';

import { useEffect, useState } from 'react';
import { title } from '@/components/primitives';
import Image from 'next/image';
import Link from 'next/link';

type Post = {
  id: string; // Firestore ID is a string
  title: string;
  shortDesc: string;
  fullDesc: string;
  authorId: string;
  createdAt: string;
  status: 'Open' | 'Closed' | 'In Progress';
  tags: string[];
  image?: string; // optional, Firestore doesn't auto-include images
};





// Mock data for posts
// This should be replaced with actual data fetching logic
import { MockPosts } from './mockposts';

// const posts = MockPosts;

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    // Simulate fetching posts from an API or database
    const fetchPosts = async () => {
      // Replace this with your actual data fetching logic
      const response = await fetch('/api/posts', { cache: 'no-store' });
      const data = await response.json();
      setPosts(data);
    };

    fetchPosts();
  }, []);

  
  // return (
  //   <div className="min-h-screen bg-gray-50 px-6 py-10">
  //     <h1 className={`${title()} text-3xl text-center mb-10`}>Dashboa</h1>

  //     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
  //       {posts.map((post) => (
  //         <Link
  //           key={post.id}
  //           href={`/posts/${post.id}`}
  //           className="flex bg-white rounded-lg shadow-sm border overflow-hidden w-full min-h-[130px] hover:shadow-md transition"
  //         >
  //           <div className="relative w-32 h-32 flex-shrink-0">
  //             <Image src={post.image} alt="Post image" fill className="object-cover" />
  //           </div>
  //           <div className="flex flex-col justify-center p-4">
  //             <h2 className="text-base font-semibold text-gray-800">{post.title}</h2>
  //             <p className="text-sm text-gray-600 mt-1">{post.shortDescription}</p>
  //           </div>
  //         </Link>
  //       ))}
  //     </div>
  //   </div>
  // );
  if (!Array.isArray(posts)) {
    console.error('Expected posts array but got:', posts);
    return <p className="text-red-500">⚠️ Failed to load posts.</p>;
  }
  return (
    <div className="min-h-screen px-6 py-10">
      <h1 className={`${title()} text-3xl text-center mb-10`}>Dashboard</h1>
      <div className="flex flex-wrap gap-6 justify-center">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/posts/${post.id}`}
            className="flex flex-col w-64 bg-white rounded-lg shadow-sm border overflow-hidden min-h-[130px] hover:shadow-md transition"
          >
            <div className={`p-4 flex ${post.image ? 'flex-row items-center gap-4' : 'flex-col'}`}>
              {post.image && (
                <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 rounded">
                  <Image
                    src={post.image}
                    alt="Post image"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <h2 className="text-base font-semibold text-gray-800">
                {post.title}
              </h2>
            </div>

            <p className="text-sm text-gray-600 px-4 pb-4">
              {post.shortDesc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
