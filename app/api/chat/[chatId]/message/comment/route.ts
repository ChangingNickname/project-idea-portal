import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import type { User } from '@/types/user';
import type { PostComment } from '@/types/chat';

export async function POST(request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userRecord = await auth.getUser(decodedToken.uid);
    const user: User = {
      uid: userRecord.uid,
      email: userRecord.email || null,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName || null,
      photoURL: userRecord.photoURL || null,
      phoneNumber: userRecord.phoneNumber || null,
      disabled: userRecord.disabled,
      isAnonymous: false,
      providerData: userRecord.providerData.map(provider => ({
        providerId: provider.providerId,
        uid: provider.uid,
        displayName: provider.displayName || null,
        email: provider.email || null,
        phoneNumber: provider.phoneNumber || null,
        photoURL: provider.photoURL || null
      })),
      customClaims: userRecord.customClaims || null,
      metadata: {
        creationTime: userRecord.metadata.creationTime || null,
        lastSignInTime: userRecord.metadata.lastSignInTime || null,
        lastRefreshTime: userRecord.metadata.lastRefreshTime || null
      },
      tenantId: userRecord.tenantId || null,
      multiFactor: []
    };

    const body = await request.json();
    const { content, parentId } = body;
    if (!content || !parentId) {
      return new NextResponse('Missing content or parentId', { status: 400 });
    }

    // Проверяем, что сообщение существует
    const messageRef = db.collection('chats').doc(chatId).collection('messages').doc(parentId);
    const messageDoc = await messageRef.get();
    if (!messageDoc.exists) {
      return new NextResponse('Parent message not found', { status: 404 });
    }

    // Создаём комментарий
    const now = new Date();
    const commentData: Omit<PostComment, 'id'> = {
      content,
      author: user,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      is_deleted: false,
      parentId
    };
    const commentRef = await messageRef.collection('comments').add(commentData);
    const comment: PostComment = { id: commentRef.id, ...commentData };
    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 