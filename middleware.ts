import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'
import { KEYCLOAK_CONFIG, getCertsUrl } from './config/keycloak'

// Paths that don't require authentication
const publicPaths = [
  '/api/auth/login',
  '/api/auth/callback',
  '/api/auth/logout',
  '/login',
  '/callback',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Get the token from the cookie
  const token = request.cookies.get('keycloak_token')?.value

  if (!token) {
    console.log('No token found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Get the JWKS from Keycloak
    const jwks = jose.createRemoteJWKSet(new URL(getCertsUrl()))

    // Verify the token
    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: `${KEYCLOAK_CONFIG.authServerUrl}/realms/${KEYCLOAK_CONFIG.realm}`,
      // Remove audience check as it might be different in the token
      // audience: KEYCLOAK_CONFIG.clientId,
    })

    console.log('Token payload:', payload)

    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('Token expired, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Add user info to headers for the application to use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.sub as string)
    requestHeaders.set('x-user-email', payload.email as string)
    requestHeaders.set('x-user-roles', (payload.resource_access?.[KEYCLOAK_CONFIG.clientId]?.roles || []).join(','))

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Token verification failed:', error)
    // Clear the invalid token
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('keycloak_token')
    return response
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 