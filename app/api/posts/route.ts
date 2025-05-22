import { db, auth } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Post, CreatePostData, PostResponse } from '@/types/post';

export async function GET() {
  try {
    console.log('🔐 Getting session cookie...');
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      console.log('❌ No session cookie found');
      return NextResponse.json<PostResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    console.log('✅ Verifying session cookie...');
    const decoded = await auth.verifySessionCookie(session);
    console.log('✅ Session verified for UID:', decoded.uid);

    console.log('📦 Fetching posts...');
    const snapshot = await db.collection('posts').get();
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];

    console.log('✅ Posts fetched:', posts.length);
    return NextResponse.json<PostResponse>({
      success: true,
      data: posts
    });
  } catch (e) {
    console.error('❌ Error in GET /api/posts:', e);
    return NextResponse.json<PostResponse>({
      success: false,
      error: 'Internal Server Error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔐 Getting session cookie...');
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      console.log('❌ No session cookie found');
      return NextResponse.json<PostResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    console.log('✅ Verifying session cookie...');
    const decoded = await auth.verifySessionCookie(session);
    console.log('✅ Session verified for UID:', decoded.uid);

    const body = await request.json() as CreatePostData;
    const { title, content, tags, image } = body;

    if (!title || !content) {
      return NextResponse.json<PostResponse>({
        success: false,
        error: 'Title and content are required'
      }, { status: 400 });
    }

    console.log('📝 Creating new post...');
    const postData: Omit<Post, 'id'> = {
      title,
      content,
      authorId: decoded.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(tags && { tags }),
      ...(image && { image })
    };

    const postRef = await db.collection('posts').add(postData);
    const newPost: Post = {
      id: postRef.id,
      ...postData
    };

    console.log('✅ Post created with ID:', postRef.id);
    return NextResponse.json<PostResponse>({
      success: true,
      data: newPost
    });
  } catch (e) {
    console.error('❌ Error in POST /api/posts:', e);
    return NextResponse.json<PostResponse>({
      success: false,
      error: 'Internal Server Error'
    }, { status: 500 });
  }
}
