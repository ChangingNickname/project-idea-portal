import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Message } from '@/types/chat';

export async function GET(
  request: Request,
  context: { params: Promise<{ chatId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const currentUser = await auth.getUser(decodedToken.uid);

    const { chatId } = await context.params;
    const chatRef = db.collection('chats').doc(chatId);
    const messagesRef = chatRef.collection('messages');
    
    const messagesSnapshot = await messagesRef
      .where('reader_by_ids', 'array-contains', currentUser.uid)
      .get();

    const unreadMessages = messagesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message))
      .filter(message => 
        !message.reader_by_ids.some((reader) => reader.uid === currentUser.uid)
      );

    return NextResponse.json({ 
      unreadCount: unreadMessages.length,
      unreadMessages 
    });
  } catch (error: any) {
    console.error('Error getting unread messages:', error);
    if (error.code === 'auth/invalid-session-cookie') {
      return new NextResponse('Invalid session', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 