import { db } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import { Post } from '@/types/posts';
import { auth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const pageToken = searchParams.get('pageToken') || null;

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    let postsQuery = db.collection('posts')
      .where('authorId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (pageToken) {
      const lastDoc = await db.collection('posts').doc(pageToken).get();
      if (lastDoc.exists) {
        postsQuery = postsQuery.startAfter(lastDoc);
      }
    }

    const snapshot = await postsQuery.get();
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));

    return NextResponse.json({
      posts,
      pageToken: snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null
    });
  } catch (error: unknown) {
    console.error('Error fetching user posts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 