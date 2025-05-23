import { db, auth } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { Post } from '@/types/posts';
import { isPost } from '@/types/posts';

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value || '';
    
    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const decoded = await auth.verifySessionCookie(session, true);
    const snapshot = await db.collection('posts').get();
    const posts: Post[] = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      const post: Post = {
        id: doc.id,
        name: data.name,
        shortDesc: data.shortDesc,
        fullDesc: data.fullDesc,
        tags: data.tags || [],
        image: data.image,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
      };
      
      if (!isPost(post)) {
        throw new Error('Invalid post data structure');
      }
      
      return post;
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error in GET /api/posts:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  return response;
}
