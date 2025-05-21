
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MockPosts } from '../../dashboard/mockposts';

const posts = MockPosts;

export default function PostsPage({ params }: { params: { id: string } }) {
  const post = posts.find((p) => p.id.toString() === params.id);
  // Send the console command showing the post data
  if (!post) return notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/dashboard" className="text-sm text-blue-600 underline mb-4 inline-block">← Back to Dashboard</Link>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="relative w-full sm:w-60 h-60">
          <Image src={post.image} alt={post.title} fill className="object-cover rounded" />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
          <p className="text-gray-700 mb-4">{post.fullDescription}</p>

          <ul className="text-sm text-gray-600 space-y-1">
            <li><strong>Author:</strong> {post.author}</li>
            <li><strong>Date:</strong> {post.date}</li>
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
