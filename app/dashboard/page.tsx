'use client';

import { title } from '@/components/primitives';
import Image from 'next/image';
import Link from 'next/link';

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
    return (
      <div className="min-h-screen px-6 py-10">
        <h1 className={`${title()} text-3xl text-center mb-10`}>Dashboard</h1>
        <div className="flex flex-row gap-6 mx-auto">
          {posts.map((post) => (
            <Link
            key={post.id}
            href={`/posts/${post.id}`}
            className='flex flex-col bg-white-500 rounded-lg shadow-sm border overflow-hidden w-264 min-h-[130px] hover:shadow-md transition'>
              <div className='flex flex-row items-center gap-4 p-4'>
                <div className='relative w-20 h-20 flex-shrink-0'>
                  <Image src={post.image} alt="Post image" fill className="object-cover" />
                </div>
                <h2 className="text-base font-semibold text-gray-800">{post.title}</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">{post.shortDescription}</p>
            </Link>
          ))}
        </div>
      </div>
  );
}
