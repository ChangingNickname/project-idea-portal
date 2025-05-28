import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that don't require authentication
const publicPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/session',
  '/api/auth/verify',
  '/api/genkit',
  '/login',
  '/register',
]

// Paths that should bypass rate limiting
const bypassRateLimitPaths = [
  '/api/user/', // User profile API requests
]

// Rate limiting constants
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

// Store for tracking requests
class RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }>;

  constructor() {
    this.store = new Map();
  }

  isRateLimited(key: string): boolean {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record) {
      this.store.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      return false;
    }

    if (now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      return false;
    }

    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
      return true;
    }

    record.count++;
    return false;
  }

  getResetTime(key: string): number {
    const record = this.store.get(key);
    return record ? record.resetTime : Date.now() + RATE_LIMIT_WINDOW;
  }
}

const rateLimitStore = new RateLimitStore();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Get client IP address from headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

  // Check if rate limiting should be applied
  const shouldRateLimit = !bypassRateLimitPaths.some(path => pathname.startsWith(path));

  if (shouldRateLimit) {
    const rateLimitKey = `${ip}:${pathname}`;
    
    if (rateLimitStore.isRateLimited(rateLimitKey)) {
      const resetTime = rateLimitStore.getResetTime(rateLimitKey);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Reset': resetTime.toString(),
          },
        }
      );
    }
  }

  // Get the session cookie
  const sessionCookie = request.cookies.get('session')?.value

  if (!sessionCookie) {
    // Return 401 for API requests
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    // Redirect to login for other requests
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verify session cookie through Firebase Admin
    const verifyResponse = await fetch(`${request.nextUrl.origin}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Cookie': `session=${sessionCookie}`
      }
    });

    if (!verifyResponse.ok) {
      throw new Error('Invalid session');
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Session verification failed:', error)
    // Return 401 for API requests
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid session',
          message: 'Authentication failed',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    // Redirect to login for other requests
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('session')
    return response
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    '/api/user/search',
    '/api/user/:id*',
    '/api/blacklist',
  ],
} 