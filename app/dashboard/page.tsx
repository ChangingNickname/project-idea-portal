'use client';

import { title } from '@/components/primitives';
import Image from 'next/image';

type Post = {
  id: number;
  title: string;
  shortDescription: string;
  fullDescription: string;
  author: string;
  date: string;
  status: 'Open' | 'Closed' | 'In Progress';
  tags: string[];
  image: string;
};


// Mock data for posts
// This should be replaced with actual data fetching logic
import { MockPosts } from './mockposts';

const posts = MockPosts;

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <h1 className={`${title()} text-3xl text-center mb-10`}>Tile view</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {posts.slice(0, 12).map((post) => (
          <div
            key={post.id}
            className="flex bg-white rounded-lg shadow-sm border overflow-hidden h-auto min-h-[120px]"
          >
            {/* Image block */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <Image
                src={post.image}
                alt="Post image"
                fill
                className="object-cover"
              />
            </div>

            {/* Text block */}
            <div className="flex-1 p-4 flex flex-col">
              <h2 className="text-base font-semibold text-gray-800">{post.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{post.shortDescription}</p>
            </div>
          </div>

        ))}
      </div>

      {/* Pagination UI */}
      <div className="mt-10 flex justify-center space-x-2">
        <button className="border rounded px-3 py-1">{'<'}</button>
        <button className="border rounded px-3 py-1">1</button>
        <button className="border rounded px-3 py-1 bg-black text-white">2</button>
        <button className="border rounded px-3 py-1">...</button>
        <button className="border rounded px-3 py-1">{'>'}</button>
      </div>
    </div>
  );
}
