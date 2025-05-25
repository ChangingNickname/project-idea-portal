import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

// Безопасное преобразование Firestore Timestamp или строки в Date
function safeToDate(value: any) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'string' || value instanceof Date) return new Date(value);
  return value;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userRecord = await auth.getUser(decodedToken.uid);

    // Получаем чат
    const chatRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      return new NextResponse('Chat not found', { status: 404 });
    }

    const chatData = chatDoc.data();
    if (!chatData) {
      return new NextResponse('Chat data is empty', { status: 404 });
    }

    // Проверяем, является ли пользователь участником чата
    if (!chatData.members.includes(userRecord.uid)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Получаем сообщения
    const messagesRef = chatRef.collection('messages');
    const messagesSnapshot = await messagesRef
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const messages = messagesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: safeToDate(doc.data().createdAt),
      updatedAt: safeToDate(doc.data().updatedAt),
      deletedAt: doc.data().deletedAt ? safeToDate(doc.data().deletedAt) : null
    }));

    // Получаем данные участников
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

    return NextResponse.json({
      id: chatDoc.id,
      messages: messages.reverse(),
      members: membersData,
      createdAt: chatData.createdAt.toDate(),
      updatedAt: chatData.updatedAt.toDate(),
      deletedAt: chatData.deletedAt?.toDate() || null,
      is_deleted: chatData.is_deleted
    });
  } catch (error: any) {
    console.error('Error getting chat:', error);
    if (error.code === 'auth/invalid-session-cookie') {
      return new NextResponse('Invalid session', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 