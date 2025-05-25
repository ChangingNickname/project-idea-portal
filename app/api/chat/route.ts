import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import { Chat, Message } from '@/types/chat';
import { User } from '@/types/user';
import { cookies } from 'next/headers';

async function getUserBlacklist(userId: string) {
  const blacklistRef = db.collection('blacklists');
  const q = blacklistRef.where('user.uid', '==', userId);
  const querySnapshot = await q.get();

  if (querySnapshot.empty) {
    return [];
  }

  const blacklist = querySnapshot.docs[0].data();
  return blacklist.blocked_users.map((user: User) => user.uid);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userRecord = await auth.getUser(decodedToken.uid);

    // Get user's blacklist
    const blockedUserIds = await getUserBlacklist(userRecord.uid);

    // Get all chats where user is a member
    const chatsRef = db.collection('chats');
    const q = chatsRef.where('members', 'array-contains', userRecord.uid);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return NextResponse.json({ chats: [] });
    }

    // Process each chat
    const chats = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const chatData = doc.data();
        
        // Get all messages for this chat
        const messagesRef = doc.ref.collection('messages');
        const messagesSnapshot = await messagesRef.get();
        
        const messages = messagesSnapshot.docs.map(msgDoc => {
          const msgData = msgDoc.data() as Message;
          return {
            ...msgData,
            id: msgDoc.id
          };
        });

        // Filter out chats where all messages are from blocked users
        const hasNonBlockedMessages = messages.some(
          message => !blockedUserIds.includes(message.sender.uid)
        );

        if (!hasNonBlockedMessages) {
          return null;
        }

        // Get full user data for all members
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
            } as User;
          })
        );

        return {
          id: doc.id,
          messages: messages.filter(
            message => !blockedUserIds.includes(message.sender.uid)
          ),
          members: membersData,
          createdAt: chatData.createdAt,
          updatedAt: chatData.updatedAt,
          deletedAt: chatData.deletedAt,
          is_deleted: chatData.is_deleted
        } as Chat;
      })
    );

    // Filter out null chats (those with only blocked messages)
    const filteredChats = chats.filter(chat => chat !== null);

    return NextResponse.json({ chats: filteredChats });
  } catch (error: any) {
    console.error('Error getting chats:', error);
    if (error.code === 'auth/invalid-session-cookie') {
      return new NextResponse('Invalid session', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const currentUser = await auth.getUser(decodedToken.uid);

    const { members, message } = await req.json();

    if (!members || !Array.isArray(members) || members.length < 2) {
      return NextResponse.json(
        { error: 'Chat must have at least 2 participants' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Initial message is required' },
        { status: 400 }
      );
    }

    // Check if chat with these participants already exists
    const chatsRef = db.collection('chats');
    const allMembers = [...members, currentUser.uid];
    const existingChats = await chatsRef
      .where('members', 'array-contains', currentUser.uid)
      .get();

    const existingChat = existingChats.docs.find(doc => {
      const chatData = doc.data();
      const chatMembers = new Set(chatData.members);
      return allMembers.every(memberId => chatMembers.has(memberId)) && 
             chatMembers.size === allMembers.length;
    });

    if (existingChat) {
      return NextResponse.json(
        { error: 'Chat with these participants already exists' },
        { status: 400 }
      );
    }

    // Get all members data
    const membersData = await Promise.all(
      allMembers.map(async (uid) => {
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
        } as User;
      })
    );

    // Create new chat with initial message
    const chatRef = chatsRef.doc();
    const messageRef = chatRef.collection('messages').doc();
    const now = new Date();

    const currentUserData: User = {
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

    const newMessage: Message = {
      id: messageRef.id,
      content: message,
      sender: currentUserData,
      reader_by_ids: membersData,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      is_deleted: false
    };

    const newChat: Chat = {
      id: chatRef.id,
      messages: [newMessage],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      is_deleted: false,
      members: membersData
    };

    // Create chat and message in a batch
    const batch = db.batch();
    
    batch.set(chatRef, {
      ...newChat,
      members: allMembers,
      messages: []
    });

    batch.set(messageRef, {
      ...newMessage,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });

    await batch.commit();

    return NextResponse.json({
      ...newChat,
      messages: [{
        ...newMessage,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }]
    });
  } catch (error: any) {
    console.error('Error creating chat:', error);
    if (error.code === 'auth/invalid-session-cookie') {
      return new NextResponse('Invalid session', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 