import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(request: Request, context: { params: { uid: string } }) {
  try {
    const { uid } = await context.params;
    const doc = await db.collection('posts').doc(uid).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(doc.data());
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: { uid: string } }) {
  try {
    const { uid } = await context.params;
    const doc = await db.collection('posts').doc(uid).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const body = await request.json();
    await db.collection('posts').doc(uid).update(body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: { uid: string } }) {
  try {
    const { uid } = await context.params;
    const doc = await db.collection('posts').doc(uid).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await db.collection('posts').doc(uid).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

