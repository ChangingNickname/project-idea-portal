import { db } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const doc = await db.collection('posts').doc(params.id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
