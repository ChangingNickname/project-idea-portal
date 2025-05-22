import { db, auth } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    console.log('🔐 Getting session cookie...');
    const cookieStore = cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      console.log('❌ No session cookie found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('✅ Verifying session cookie...');
    const decoded = await auth.verifySessionCookie(session);
    console.log('✅ Session verified for UID:', decoded.uid);

    console.log('📦 Fetching posts...');
    const snapshot = await db.collection('posts').get();
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log('✅ Posts fetched:', posts.length);
    return NextResponse.json(posts);
  } catch (e) {
    console.error('❌ Error in GET /api/posts:', e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
