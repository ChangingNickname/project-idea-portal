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

const posts: Post[] = [
  {
    id: 1,
    title: 'Campus Recycling System',
    shortDescription: 'Revamp bins and awareness',
    fullDescription: 'Redesign recycling bins and raise student awareness.',
    author: 'Jane Doe',
    date: '2025-05-20',
    status: 'Open',
    tags: ['Sustainability'],
    image: 'https://picsum.photos/seed/1/200/200',
  },
  {
    id: 2,
    title: 'AI Tutoring Platform',
    shortDescription: 'Connect students with AI tutors',
    fullDescription: 'Build an AI-powered open tutoring system.',
    author: 'John Smith',
    date: '2025-05-18',
    status: 'In Progress',
    tags: ['AI'],
    image: 'https://picsum.photos/seed/2/200/200',
  },
  {
    id: 3,
    title: 'Club Website System',
    shortDescription: 'Redesign club portals',
    fullDescription: 'Modernize student club portals and event coordination.',
    author: 'Alice Nguyen',
    date: '2025-05-15',
    status: 'Closed',
    tags: ['Web'],
    image: 'https://picsum.photos/seed/3/200/200',
  },
  // Add more as needed
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <h1 className={`${title()} text-3xl text-center mb-10`}>Tile view</h1>

      <div className="flex flex-wrap justify-center gap-6">
        {posts.slice(0, 12).map((post) => (
          <div
            key={post.id}
            className="flex h-36 bg-white rounded-lg shadow-sm border overflow-hidden"
          >
            <div className="relative w-32 h-full flex-shrink-0">
              <Image src={post.image} alt="Post image" fill className="object-cover" />
            </div>
            <div className="flex-1 p-4 flex flex-col justify-center">
              <h2 className="text-base font-semibold text-gray-800 mb-1">{post.title}</h2>
              <p className="text-sm text-gray-600">{post.shortDescription}</p>
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
