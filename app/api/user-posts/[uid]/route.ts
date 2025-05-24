import { db } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

export async function GET(_: Request, context: { params: { uid: string } }) {
  const { params } = await Promise.resolve(context); // ✅ fix here
  try {
    const snapshot = await db
      .collection('posts')
      .where('authorId', '==', params.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const posts = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        shortDesc: data.shortDesc,
        fullDesc: data.fullDesc,
        image: data.image || '',
        tags: data.tags || [],
        createdAt: data.createdAt?.toDate?.().toISOString() ?? '',
        updatedAt: data.updatedAt?.toDate?.().toISOString() ?? '',
        status: data.status,
      };
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('🔥 Error fetching user posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
