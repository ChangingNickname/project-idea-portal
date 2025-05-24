import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that don't require authentication
const publicPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/login',
  '/register',
]

// Хранилище для отслеживания запросов
interface RequestData {
  timestamp: number;
  url: string;
}

const requestStore = new Map<string, RequestData>();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Получаем IP адрес клиента из заголовков
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
  const now = Date.now();

  // Получаем или создаем запись для IP
  const requestData = requestStore.get(ip);
  const currentUrl = request.nextUrl.pathname + request.nextUrl.search;

  // Проверяем, был ли уже такой запрос в последнюю секунду
  if (requestData && 
      requestData.url === currentUrl && 
      now - requestData.timestamp < 1000) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Please wait at least 1 second between identical requests',
        retryAfter: 1,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '1',
        },
      }
    );
  }

  // Сохраняем информацию о запросе
  requestStore.set(ip, {
    timestamp: now,
    url: currentUrl,
  });

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
  ],
} 