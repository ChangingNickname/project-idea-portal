import { db, auth } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { Post } from '@/types/posts';
import { isPost } from '@/types/posts';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value || '';
    
    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const decoded = await auth.verifySessionCookie(session, true);
    const snapshot = await db.collection('posts').get();
    
    if (snapshot.empty) {
      return NextResponse.json([]);
    }

    const posts: Post[] = snapshot.docs
      .map((doc: any) => {
        try {
          const data = doc.data();
          const post: Post = {
            id: doc.id,
            name: data.name || '',
            shortDesc: data.shortDesc || '',
            fullDesc: data.fullDesc || '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            image: data.image || '',
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
          };
          
          return isPost(post) ? post : null;
        } catch (error) {
          console.error(`Error processing post ${doc.id}:`, error);
          return null;
        }
      })
      .filter((post): post is Post => post !== null);

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error in GET /api/posts:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value || '';
    
    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const decoded = await auth.verifySessionCookie(session, true);
    const body = await request.json();
    
    const post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = {
      name: body.name,
      shortDesc: body.shortDesc,
      fullDesc: body.fullDesc,
      tags: body.tags,
      image: body.image,
    };

    if (!isPost({ ...post, id: 'temp', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })) {
      return NextResponse.json({ error: 'Invalid post data' }, { status: 400 });
    }

    const postRef = await db.collection('posts').add({
      ...post,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ id: postRef.id, ...post });
  } catch (error) {
    console.error('Error in POST /api/posts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
