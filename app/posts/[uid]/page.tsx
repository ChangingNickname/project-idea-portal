import { db } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { notFound } from 'next/navigation';
import { FullPost } from '@/components/posts/FullPost';
import { Post } from '@/types/posts';

export default async function Page(props: { params: { uid: string } }) {
  const { uid } = await props.params;
  // or if it's not a Promise, just:
  // const { uid } = props.params;

  const doc = await db.collection('posts').doc(uid).get();
  if (!doc.exists) return notFound();
  
  const rawData = doc.data();
  if (!rawData) return notFound();

  const post: Post = {
    id: doc.id,
    name: rawData.name,
    shortDesc: rawData.shortDesc,
    fullDesc: rawData.fullDesc,
    tags: rawData.tags || [],
    image: rawData.image,
    authorId: rawData.authorId,
    status: rawData.status,
    email: rawData.email,
    createdAt: rawData.createdAt?.toDate?.().toISOString?.() ?? '',
    updatedAt: rawData.updatedAt?.toDate?.().toISOString?.() ?? undefined,
  };

  return (
    <div className="w-full min-h-screen px-0 py-10 bg-white dark:bg-gray-900">
      <FullPost post={post} />
    </div>
  );
}

