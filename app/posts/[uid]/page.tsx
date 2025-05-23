import { db } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { notFound } from 'next/navigation';
import PostPageClient from './PostPageClient';

export default async function Page({ params }: { params: { id: string } }) {
  const doc = await db.collection('posts').doc(params.id).get();
  if (!doc.exists) return notFound();

  const rawData = doc.data();
  const post = {
    id: doc.id,
    ...rawData,
    createdAt: rawData.createdAt?.toDate?.().toISOString?.() ?? '',
    updatedAt: rawData.updatedAt?.toDate?.().toISOString?.() ?? '',
  };


  let authorName = 'Unknown Author';
  if (post.authorId) {
    try {
      const userRecord = await getAuth().getUser(post.authorId);
      authorName = userRecord.displayName || userRecord.email || 'Anonymous';
    } catch (err) {
      console.warn('⚠️ Failed to fetch author info for UID:', post.authorId, err);
    }
  }

  return (
    <PostPageClient post={{ ...post, authorName }} />
  );
}
