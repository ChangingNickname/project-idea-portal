'use client';

import { useState, useEffect } from 'react';
import { PostModal } from '@/components/create_form/PostModal';
import { auth } from '@/lib/firebase/client';
import Image from 'next/image';
import Link from 'next/link';

export default function PostPageClient({ post }: { post: any }) {
  const [isAuthor, setIsAuthor] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user?.uid === post.authorId) {
        setIsAuthor(true);
      }
    });
    return () => unsubscribe();
  }, [post.authorId]);

  return (
    <div className="mx-auto px-6 py-10">
      <Link href="/dashboard" className="text-sm text-blue-600 underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>

      {post.image && (
        <Image
          src={post.image}
          alt={post.title || 'Post image'}
          width={800}
          height={500}
          className="rounded mb-6 object-contain w-full"
        />
      )}

      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>

      <ul className="text-sm text-gray-600 space-y-1 mb-4">
        <li><strong>Author:</strong> {post.authorName}</li>
        <li><strong>Date:</strong> {new Date(post.createdAt).toLocaleDateString()}</li>
        <li><strong>Status:</strong> {post.status}</li>
      </ul>

      <div className="mt-4 flex gap-2 flex-wrap mb-6">
        {post.tags.map((tag: string, i: number) => (
          <span key={i} className="bg-gray-200 text-xs px-2 py-1 rounded-full">{tag}</span>
        ))}
      </div>

      <div className="prose text-gray-800 mb-10">{post.fullDesc}</div>

      {isAuthor && (
        <>
          <button
            onClick={() => setEditOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ✏️ Edit Post
          </button>

          <PostModal
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            initialData={post} // pass post as initial data
            isEdit={true} // tell modal to use update logic
          />
        </>
      )}
    </div>
  );
}
