import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { User } from '@/types/chat';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const currentUser = await auth.getUser(decodedToken.uid);

    // Получаем черный список пользователя
    const blacklistRef = db.collection('blacklists');
    const blacklistQuery = blacklistRef.where('user.uid', '==', currentUser.uid);
    const blacklistSnapshot = await blacklistQuery.get();

    let blockedUserIds: string[] = [];
    if (!blacklistSnapshot.empty) {
      const blacklist = blacklistSnapshot.docs[0].data();
      blockedUserIds = blacklist.blocked_users.map((user: User) => user.uid);
    }

    // Получаем все чаты пользователя
    const chatsSnapshot = await db.collection('chats')
      .where('members', 'array-contains', currentUser.uid)
      .get();

    let totalUnreadCount = 0;
    const unreadByChat: { [chatId: string]: number } = {};

    // Для каждого чата получаем непрочитанные сообщения
    for (const chatDoc of chatsSnapshot.docs) {
      const messagesSnapshot = await chatDoc.ref.collection('messages').get();

      const unreadCount = messagesSnapshot.docs.filter(doc => {
        const message = doc.data();
        // Проверяем, что сообщение не от заблокированного пользователя
        if (blockedUserIds.includes(message.sender.uid)) {
          return false;
        }
        // Проверяем, что текущий пользователь не прочитал сообщение
        return !message.reader_by_ids.some((reader: User) => reader.uid === currentUser.uid);
      }).length;

      if (unreadCount > 0) {
        totalUnreadCount += unreadCount;
        unreadByChat[chatDoc.id] = unreadCount;
      }
    }

    return NextResponse.json({ 
      totalUnreadCount,
      unreadByChat
    });
  } catch (error: any) {
    console.error('Error getting unread messages count:', error);
    if (error.code === 'auth/invalid-session-cookie') {
      return new NextResponse('Invalid session', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 