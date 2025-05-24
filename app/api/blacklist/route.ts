import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { Blacklist } from '@/types/blacklist';
import { User } from '@/types/user';

// Получить черный список пользователя
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userRecord = await auth.getUser(decodedToken.uid);

    const blacklistRef = db.collection('blacklists');
    const q = blacklistRef.where('user.uid', '==', userRecord.uid);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return NextResponse.json({ blocked_users: [] });
    }

    const blacklist = querySnapshot.docs[0].data() as Blacklist;
    return NextResponse.json(blacklist);
  } catch (error: any) {
    console.error('Error getting blacklist:', error);
    if (error.code === 'auth/invalid-session-cookie') {
      return new NextResponse('Invalid session', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Добавить пользователей в черный список
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userRecord = await auth.getUser(decodedToken.uid);

    const { userIds } = await request.json();
    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds must be an array' }, { status: 400 });
    }

    // Проверяем, не пытается ли пользователь заблокировать самого себя
    if (userIds.includes(userRecord.uid)) {
      return NextResponse.json(
        { error: 'You cannot add yourself to the blacklist' },
        { status: 400 }
      );
    }

    const blacklistRef = db.collection('blacklists');
    const q = blacklistRef.where('user.uid', '==', userRecord.uid);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      // Создаем новый черный список
      const userData: User = {
        uid: userRecord.uid,
        email: userRecord.email || null,
        emailVerified: userRecord.emailVerified || false,
        displayName: userRecord.displayName || null,
        photoURL: userRecord.photoURL || null,
        phoneNumber: userRecord.phoneNumber || null,
        disabled: userRecord.disabled || false,
        isAnonymous: userRecord.providerData.length === 0,
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
        multiFactor: userRecord.multiFactor?.enrolledFactors?.map(factor => ({
          uid: factor.uid,
          factorId: factor.factorId,
          displayName: factor.displayName || null,
          enrollmentTime: factor.enrollmentTime
        })) || []
      };

      const newBlacklist: Blacklist = {
        id: '',
        user: userData,
        blocked_users: []
      };

      const docRef = await blacklistRef.add(newBlacklist);
      await docRef.update({ id: docRef.id });
      return NextResponse.json({ ...newBlacklist, id: docRef.id });
    }

    // Обновляем существующий черный список
    const blacklistDoc = querySnapshot.docs[0];
    const blacklist = blacklistDoc.data() as Blacklist;
    
    // Получаем информацию о пользователях для добавления
    const usersToAdd: User[] = [];
    for (const userId of userIds) {
      // Пропускаем текущего пользователя
      if (userId === userRecord.uid) continue;

      const targetUser = await auth.getUser(userId);
      const userData: User = {
        uid: targetUser.uid,
        email: targetUser.email || null,
        emailVerified: targetUser.emailVerified || false,
        displayName: targetUser.displayName || null,
        photoURL: targetUser.photoURL || null,
        phoneNumber: targetUser.phoneNumber || null,
        disabled: targetUser.disabled || false,
        isAnonymous: targetUser.providerData.length === 0,
        providerData: targetUser.providerData.map(provider => ({
          providerId: provider.providerId,
          uid: provider.uid,
          displayName: provider.displayName || null,
          email: provider.email || null,
          phoneNumber: provider.phoneNumber || null,
          photoURL: provider.photoURL || null
        })),
        customClaims: targetUser.customClaims || null,
        metadata: {
          creationTime: targetUser.metadata.creationTime || null,
          lastSignInTime: targetUser.metadata.lastSignInTime || null,
          lastRefreshTime: targetUser.metadata.lastRefreshTime || null
        },
        tenantId: targetUser.tenantId || null,
        multiFactor: targetUser.multiFactor?.enrolledFactors?.map(factor => ({
          uid: factor.uid,
          factorId: factor.factorId,
          displayName: factor.displayName || null,
          enrollmentTime: factor.enrollmentTime
        })) || []
      };
      usersToAdd.push(userData);
    }

    // Если после фильтрации не осталось пользователей для добавления
    if (usersToAdd.length === 0) {
      return NextResponse.json(
        { error: 'No valid users to add to blacklist' },
        { status: 400 }
      );
    }

    // Добавляем только новых пользователей
    const existingIds = new Set(blacklist.blocked_users.map(user => user.uid));
    const newBlockedUsers = usersToAdd.filter(user => !existingIds.has(user.uid));

    await blacklistDoc.ref.update({
      blocked_users: [...blacklist.blocked_users, ...newBlockedUsers]
    });

    return NextResponse.json({
      ...blacklist,
      blocked_users: [...blacklist.blocked_users, ...newBlockedUsers]
    });
  } catch (error: any) {
    console.error('Error adding to blacklist:', error);
    if (error.code === 'auth/invalid-session-cookie') {
      return new NextResponse('Invalid session', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Удалить пользователей из черного списка
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userRecord = await auth.getUser(decodedToken.uid);

    const { userIds } = await request.json();
    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds must be an array' }, { status: 400 });
    }

    const blacklistRef = db.collection('blacklists');
    const q = blacklistRef.where('user.uid', '==', userRecord.uid);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Blacklist not found' }, { status: 404 });
    }

    const blacklistDoc = querySnapshot.docs[0];
    const blacklist = blacklistDoc.data() as Blacklist;

    // Удаляем указанных пользователей из черного списка
    const updatedBlockedUsers = blacklist.blocked_users.filter(
      user => !userIds.includes(user.uid)
    );

    await blacklistDoc.ref.update({
      blocked_users: updatedBlockedUsers
    });

    return NextResponse.json({
      ...blacklist,
      blocked_users: updatedBlockedUsers
    });
  } catch (error: any) {
    console.error('Error removing from blacklist:', error);
    if (error.code === 'auth/invalid-session-cookie') {
      return new NextResponse('Invalid session', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Отменить блокировку пользователя
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userRecord = await auth.getUser(decodedToken.uid);

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const blacklistRef = db.collection('blacklists');
    const q = blacklistRef.where('user.uid', '==', userRecord.uid);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Blacklist not found' }, { status: 404 });
    }

    const blacklistDoc = querySnapshot.docs[0];
    const blacklist = blacklistDoc.data() as Blacklist;

    // Проверяем, есть ли пользователь в черном списке
    const userIndex = blacklist.blocked_users.findIndex(user => user.uid === userId);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User is not in blacklist' }, { status: 404 });
    }

    // Удаляем пользователя из черного списка
    const updatedBlockedUsers = blacklist.blocked_users.filter(user => user.uid !== userId);

    await blacklistDoc.ref.update({
      blocked_users: updatedBlockedUsers
    });

    return NextResponse.json({
      ...blacklist,
      blocked_users: updatedBlockedUsers
    });
  } catch (error: any) {
    console.error('Error unblocking user:', error);
    if (error.code === 'auth/invalid-session-cookie') {
      return new NextResponse('Invalid session', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 