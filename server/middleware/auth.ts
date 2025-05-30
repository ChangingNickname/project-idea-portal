import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { defineEventHandler, getCookie, setCookie, sendRedirect } from 'h3'

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  })
}

const SESSION_REFRESH_THRESHOLD = 30 * 60 * 1000 // 30 minutes

// List of public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', // Root page
  '',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/api/public',
  '/_nuxt', // Nuxt assets
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
]

export default defineEventHandler(async (event) => {
  // Check if the current path is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    // Exact match for root path
    if (route === '/' && event.path === '/') {
      return true
    }
    // For other routes, check if path starts with the route
    return route !== '/' && event.path.startsWith(route)
  })
  
  if (isPublicRoute) {
    return
  }

  const sessionCookie = getCookie(event, 'session')

  if (!sessionCookie) {
    return sendRedirect(event, '/login')
  }

  try {
    // Verify session by calling our verify endpoint
    await $fetch('/api/auth/verify', {
      headers: {
        cookie: `session=${sessionCookie}`
      }
    })
    console.log('session verified')
  } catch (error) {
    console.log('session verification failed')
    // If verification fails, redirect to login
    return sendRedirect(event, '/login')
  }
}) 