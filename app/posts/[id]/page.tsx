import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase/admin';

export default async function PostsPage({ params }: { params: { id: string } }) {
  const doc = await db.collection('posts').doc(params.id).get();

  if (!doc.exists) return notFound();

  const post = { id: doc.id, ...doc.data() } as {
    id: string;
    title: string;
    fullDesc: string;
    image: string;
    authorId: string;
    createdAt: string;
    status: string;
    tags: string[];
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/dashboard" className="text-sm text-blue-600 underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>

      {/* Image */}
      <Image
        src={post.image}
        alt={post.title || 'Post image'}
        width={800}
        height={500}
        className="rounded mb-6 object-contain w-full"
      />

      {/* Title */}
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>

      {/* Meta Info */}
      <ul className="text-sm text-gray-600 space-y-1 mb-4">
        <li><strong>Author:</strong> {post.authorId}</li>
        <li><strong>Date:</strong> {new Date(post.createdAt).toLocaleDateString()}</li>
        <li><strong>Status:</strong> {post.status}</li>
      </ul>

      {/* Tags */}
      <div className="mt-4 flex gap-2 flex-wrap mb-6">
        {post.tags.map((tag, i) => (
          <span key={i} className="bg-gray-200 text-xs px-2 py-1 rounded-full">{tag}</span>
        ))}
      </div>

      {/* Full description */}
      <div className="prose text-gray-800">{post.fullDesc}</div>
    </div>

  );
}
