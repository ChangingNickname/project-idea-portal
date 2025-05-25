import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/admin';
import { User } from '@/types/user';

export async function GET(
  request: Request,
  context: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await context.params;
    
    if (!uid || uid === 'undefined' || uid === 'null') {
      return new NextResponse('Invalid user ID', { status: 400 });
    }

    try {
      const userRecord = await auth.getUser(uid);

      const userData: User = {
        uid: userRecord.uid,
        email: userRecord.email || null,
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName || null,
        photoURL: userRecord.photoURL || null,
        phoneNumber: userRecord.phoneNumber || null,
        disabled: userRecord.disabled,
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
          enrollmentTime: factor.enrollmentTime || new Date().toISOString()
        })) || []
      };

      return NextResponse.json(userData);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return new NextResponse('User not found', { status: 404 });
      }
      throw error; // Пробрасываем другие ошибки в общий обработчик
    }
  } catch (error: any) {
    console.error('Error in /api/user/[uid]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 