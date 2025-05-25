// /app/api/posts/route.ts
import { db } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import { Post } from '@/types/posts';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const pageToken = searchParams.get('pageToken') || null;

  try {
    let postsQuery = db.collection('posts').orderBy('createdAt', 'desc').limit(limit);

    if (pageToken) {
      const lastDoc = await db.collection('posts').doc(pageToken).get();
      if (lastDoc.exists) {
        postsQuery = postsQuery.startAfter(lastDoc);
      }
    }

    if (query) {
      const snapshot = await postsQuery.get();
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      const filteredPosts = posts.filter(post => {
        const searchQuery = query.toLowerCase();
        return (
          post.name.toLowerCase().includes(searchQuery) ||
          post.authorId.toLowerCase().includes(searchQuery) ||
          post.email?.toLowerCase().includes(searchQuery)
        );
      });
      return NextResponse.json({ posts: filteredPosts, pageToken: null });
    } else {
      const snapshot = await postsQuery.get();
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      return NextResponse.json({ posts, pageToken: snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null });
    }
  } catch (error: unknown) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('POST data:', data);

    const post = {
      ...data,
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection('posts').add(post);

    return NextResponse.json({ id: ref.id });
  } catch (err: unknown) {
    console.error('Backend error creating post:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create post', details: errorMessage }, { status: 500 });
  }
}

