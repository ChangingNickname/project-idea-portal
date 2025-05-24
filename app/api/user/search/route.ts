import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/admin';
import { UserRecord } from 'firebase-admin/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const pageToken = searchParams.get('pageToken') || undefined;

    console.log('Search request:', { query, pageToken });

    // Если запрос пустой, возвращаем последних пользователей
    if (!query.trim()) {
      console.log('Empty query, fetching latest users');
      const listUsersResult = await auth.listUsers(10, pageToken);
      console.log('Fetched users count:', listUsersResult.users.length);
      
      const mappedUsers = listUsersResult.users.map(user => ({
        uid: user.uid,
        email: user.email || null,
        emailVerified: user.emailVerified || false,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        phoneNumber: user.phoneNumber || null,
        disabled: user.disabled || false,
        isAnonymous: !user.providerData || user.providerData.length === 0,
        providerData: (user.providerData || []).map(provider => ({
          providerId: provider.providerId,
          uid: provider.uid,
          displayName: provider.displayName || null,
          email: provider.email || null,
          phoneNumber: provider.phoneNumber || null,
          photoURL: provider.photoURL || null
        })),
        customClaims: user.customClaims || null,
        metadata: {
          creationTime: user.metadata?.creationTime || null,
          lastSignInTime: user.metadata?.lastSignInTime || null,
          lastRefreshTime: user.metadata?.lastRefreshTime || null
        },
        tenantId: user.tenantId || null,
        multiFactor: user.multiFactor?.enrolledFactors?.map(factor => ({
          uid: factor.uid,
          factorId: factor.factorId,
          displayName: factor.displayName || null,
          enrollmentTime: factor.enrollmentTime
        })) || []
      }));

      console.log('Mapped users successfully');
      return NextResponse.json({
        users: mappedUsers,
        pageToken: listUsersResult.pageToken || null
      });
    }

    // Поиск по email или UID
    console.log('Searching users with query:', query);
    let allUsers: UserRecord[] = [];
    let nextPageToken = pageToken;
    
    // Получаем всех пользователей, пока не найдем нужных или не закончатся страницы
    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      console.log('Fetched page of users:', listUsersResult.users.length);
      
      const filteredUsers = listUsersResult.users.filter((user: UserRecord) => 
        (user.email?.toLowerCase() || '').includes(query.toLowerCase()) ||
        user.uid.toLowerCase().includes(query.toLowerCase())
      );
      
      console.log('Filtered users count:', filteredUsers.length);
      allUsers = [...allUsers, ...filteredUsers];
      nextPageToken = listUsersResult.pageToken;
      
      // Если нашли достаточно результатов или закончились страницы, прекращаем поиск
      if (allUsers.length >= 10 || !nextPageToken) {
        break;
      }
    } while (nextPageToken);

    console.log('Total found users:', allUsers.length);

    // Возвращаем только первые 10 результатов
    const mappedUsers = allUsers.slice(0, 10).map(user => ({
      uid: user.uid,
      email: user.email || null,
      emailVerified: user.emailVerified || false,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      phoneNumber: user.phoneNumber || null,
      disabled: user.disabled || false,
      isAnonymous: !user.providerData || user.providerData.length === 0,
      providerData: (user.providerData || []).map(provider => ({
        providerId: provider.providerId,
        uid: provider.uid,
        displayName: provider.displayName || null,
        email: provider.email || null,
        phoneNumber: provider.phoneNumber || null,
        photoURL: provider.photoURL || null
      })),
      customClaims: user.customClaims || null,
      metadata: {
        creationTime: user.metadata?.creationTime || null,
        lastSignInTime: user.metadata?.lastSignInTime || null,
        lastRefreshTime: user.metadata?.lastRefreshTime || null
      },
      tenantId: user.tenantId || null,
      multiFactor: user.multiFactor?.enrolledFactors?.map(factor => ({
        uid: factor.uid,
        factorId: factor.factorId,
        displayName: factor.displayName || null,
        enrollmentTime: factor.enrollmentTime
      })) || []
    }));

    console.log('Mapped users successfully');
    return NextResponse.json({
      users: mappedUsers,
      pageToken: nextPageToken || null
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
} 