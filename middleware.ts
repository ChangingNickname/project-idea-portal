import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/firebase/admin'

// Paths that don't require authentication
const publicPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/login',
  '/register',
]

// Paths that should bypass rate limiting
const bypassRateLimitPaths = [
  '/api/user/', // API запросы к профилю пользователя
]

// Константы для rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 минута
const MAX_REQUESTS_PER_WINDOW = 60; // 60 запросов в минуту

// Хранилище для отслеживания запросов
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

  // Получаем IP адрес клиента из заголовков
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

  // Проверяем, нужно ли применять rate limiting
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

  // Get the token from the cookie
  const token = request.cookies.get('firebase_token')?.value

  if (!token) {
    // Для API запросов возвращаем 401
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
    // Для остальных запросов редирект на логин
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Проверяем токен через Firebase Auth REST API
    const verifyResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!verifyResponse.ok) {
      throw new Error('Invalid token');
    }

    // Add user info to headers for the application to use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-token', token)

    // Клонируем заголовки и добавляем ID пользователя
    const decodedClaims = await auth.verifySessionCookie(request.cookies.get('session')?.value);
    requestHeaders.set('x-user-id', decodedClaims.uid);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Token verification failed:', error)
    // Для API запросов возвращаем 401
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid token',
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
    // Для остальных запросов редирект на логин
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('firebase_token')
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