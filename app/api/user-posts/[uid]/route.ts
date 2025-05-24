import { db } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  try {
    const snapshot = await db
      .collection('posts')
      .where('authorId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
