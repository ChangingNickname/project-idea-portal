import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { User } from '@/types/user';

export async function GET(): Promise<NextResponse<User | string>> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie);
    const userRecord = await auth.getUser(decodedToken.uid);

    const userData: User = {
      uid: userRecord.uid,
      email: userRecord.email ?? null,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName ?? null,
      photoURL: userRecord.photoURL ?? null,
      phoneNumber: userRecord.phoneNumber ?? null,
      disabled: userRecord.disabled,
      isAnonymous: userRecord.providerData.length === 0,
      providerData: userRecord.providerData.map(provider => ({
        providerId: provider.providerId,
        uid: provider.uid,
        displayName: provider.displayName ?? null,
        email: provider.email ?? null,
        phoneNumber: provider.phoneNumber ?? null,
        photoURL: provider.photoURL ?? null
      })),
      customClaims: userRecord.customClaims ?? null,
      metadata: {
        creationTime: userRecord.metadata.creationTime ?? null,
        lastSignInTime: userRecord.metadata.lastSignInTime ?? null,
        lastRefreshTime: userRecord.metadata.lastRefreshTime ?? null
      },
      tenantId: userRecord.tenantId ?? null,
      multiFactor: userRecord.multiFactor?.enrolledFactors ? {
        enrolledFactors: userRecord.multiFactor.enrolledFactors.map(factor => ({
          uid: factor.uid,
          factorId: factor.factorId,
          displayName: factor.displayName ?? null,
          enrollmentTime: factor.enrollmentTime ?? null
        }))
      } : null
    };

    return NextResponse.json(userData);
  } catch (error: any) {
    console.error('Error in /api/user/me:', error);
    if (error.code === 'auth/invalid-session-cookie') {
      return new NextResponse('Invalid session', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 