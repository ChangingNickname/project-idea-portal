import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const currentUser = await auth.getUser(decodedToken.uid);

    const { chatId } = await params;
    const chatRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      return new NextResponse('Chat not found', { status: 404 });
    }

    const chatData = chatDoc.data();
    if (!chatData) {
      return new NextResponse('Chat data is empty', { status: 404 });
    }

    if (!chatData.members.includes(currentUser.uid)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const membersData = await Promise.all(
      chatData.members.map(async (uid: string) => {
        const user = await auth.getUser(uid);
        return {
          uid: user.uid,
          email: user.email || null,
          emailVerified: user.emailVerified,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          phoneNumber: user.phoneNumber || null,
          disabled: user.disabled,
          isAnonymous: false,
          providerData: user.providerData.map(provider => ({
            providerId: provider.providerId,
            uid: provider.uid,
            displayName: provider.displayName || null,
            email: provider.email || null,
            phoneNumber: provider.phoneNumber || null,
            photoURL: provider.photoURL || null
          })),
          customClaims: user.customClaims || null,
          metadata: {
            creationTime: user.metadata.creationTime || null,
            lastSignInTime: user.metadata.lastSignInTime || null,
            lastRefreshTime: user.metadata.lastRefreshTime || null
          },
          tenantId: user.tenantId || null,
          multiFactor: []
        };
      })
    );

    const messageRef = chatRef.collection('messages').doc();
    const now = new Date();

    const currentUserData = {
      uid: currentUser.uid,
      email: currentUser.email || null,
      emailVerified: currentUser.emailVerified,
      displayName: currentUser.displayName || null,
      photoURL: currentUser.photoURL || null,
      phoneNumber: currentUser.phoneNumber || null,
      disabled: currentUser.disabled,
      isAnonymous: false,
      providerData: currentUser.providerData.map(provider => ({
        providerId: provider.providerId,
        uid: provider.uid,
        displayName: provider.displayName || null,
        email: provider.email || null,
        phoneNumber: provider.phoneNumber || null,
        photoURL: provider.photoURL || null
      })),
      customClaims: currentUser.customClaims || null,
      metadata: {
        creationTime: currentUser.metadata.creationTime || null,
        lastSignInTime: currentUser.metadata.lastSignInTime || null,
        lastRefreshTime: currentUser.metadata.lastRefreshTime || null
      },
      tenantId: currentUser.tenantId || null,
      multiFactor: []
    };

    const newMessage = {
      id: messageRef.id,
      content,
      sender: currentUserData,
      reader_by_ids: membersData,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      is_deleted: false
    };

    await messageRef.set(newMessage);

    await chatRef.update({
      updatedAt: now
    });

    return NextResponse.json({
      ...newMessage,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    if (error.code === 'auth/invalid-session-cookie') {
      return new NextResponse('Invalid session', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 