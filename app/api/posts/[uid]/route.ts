import { db } from '@/lib/firebase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: { uid: string } }) {
  try {
    const doc = await db.collection('posts').doc(params.uid).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const postId = params.uid;
    const body = await req.json();

    await db.collection('posts').doc(postId).update({
      title: body.title,
      shortDesc: body.shortDesc,
      fullDesc: body.fullDesc,
      image: body.image,
      tags: body.tags,
      status: body.status,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ message: 'Post updated' });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { uid: string } }) {
  try {
    await db.collection('posts').doc(params.uid).delete();
    return NextResponse.json({ message: 'Post deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

