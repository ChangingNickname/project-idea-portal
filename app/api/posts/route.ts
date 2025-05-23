// /app/api/posts/route.ts
import { db } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const snapshot = await db.collection('posts').get();
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(posts); // ✅ MUST be an array
  } catch (err) {
    console.error('🔥 Error fetching posts:', err);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log('📥 POST data:', data);

    const post = {
      ...data,
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection('posts').add(post);

    return NextResponse.json({ id: ref.id });
  } catch (err) {
    console.error('❌ Backend error creating post:', err);
    return NextResponse.json({ error: 'Failed to create post', details: err.message }, { status: 500 });
  }
}

