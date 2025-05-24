import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminAuth } from '@/config/firebase-admin'
import { auth } from '@/lib/firebase/admin'

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value || ''
    
    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    await adminAuth.verifySessionCookie(session, true)
    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 })
  
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  
  return response
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Проверяем токен через Firebase Admin
    await auth.verifyIdToken(token);

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
} 