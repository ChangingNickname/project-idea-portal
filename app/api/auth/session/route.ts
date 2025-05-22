import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Set cookie options
    const options = {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    // Create response with cookie
    const response = NextResponse.json({ status: 'success' });
    response.cookies.set('session', sessionCookie, options);

    return response;
  } catch (error) {
    console.error('Error creating session:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 