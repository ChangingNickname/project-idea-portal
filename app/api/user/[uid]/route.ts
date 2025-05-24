import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/admin';
import { User } from '@/types/user';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userRecord = await auth.getUser(id);

    const userData: User = {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      phoneNumber: userRecord.phoneNumber,
      disabled: userRecord.disabled,
      isAnonymous: userRecord.providerData.length === 0,
      providerData: userRecord.providerData.map(provider => ({
        providerId: provider.providerId,
        uid: provider.uid,
        displayName: provider.displayName,
        email: provider.email,
        phoneNumber: provider.phoneNumber,
        photoURL: provider.photoURL
      })),
      customClaims: userRecord.customClaims,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
        lastRefreshTime: userRecord.metadata.lastRefreshTime
      },
      tenantId: userRecord.tenantId,
      multiFactor: userRecord.multiFactor?.enrolledFactors?.map(factor => ({
        uid: factor.uid,
        factorId: factor.factorId,
        displayName: factor.displayName,
        enrollmentTime: factor.enrollmentTime
      }))
    };

    return NextResponse.json(userData);
  } catch (error: any) {
    console.error('Error in /api/user/[id]:', error);
    if (error.code === 'auth/user-not-found') {
      return new NextResponse('User not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 