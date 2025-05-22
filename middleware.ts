import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that don't require authentication
const publicPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/login',
  '/register',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Get the token from the cookie
  const token = request.cookies.get('firebase_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Add user info to headers for the application to use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-token', token)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Token verification failed:', error)
    // Clear the invalid token
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('firebase_token')
    return response
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 