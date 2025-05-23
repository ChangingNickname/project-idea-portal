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

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="relative w-full sm:w-60 h-60">
          <Image src={post.image} alt={post.title} fill className="object-cover rounded" />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
          <div className="prose text-gray-800 mb-4">{post.fullDesc}</div>

          <ul className="text-sm text-gray-600 space-y-1">
            <li><strong>Author:</strong> {post.authorId}</li>
            <li><strong>Date:</strong> {new Date(post.createdAt).toLocaleDateString()}</li>
            <li><strong>Status:</strong> {post.status}</li>
          </ul>

          <div className="mt-4 flex gap-2 flex-wrap">
            {post.tags.map((tag, i) => (
              <span key={i} className="bg-gray-200 text-xs px-2 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
