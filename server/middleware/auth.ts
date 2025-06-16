import { defineEventHandler, createError, sendRedirect } from 'h3'
import { checkAuth } from '~~/server/utils/auth'

// Список публичных маршрутов, не требующих авторизации
const PUBLIC_ROUTES = [
  '/', // Главная страница
  '/ideas', // Дашборд
  '/login', // Страница входа
  '/_nuxt', // Nuxt ассеты
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
] as const

// Маршруты, где GET запросы публичные, а остальные требуют авторизации
const PUBLIC_GET_ROUTES = [
  '/api/posts', // Публичный API для постов
  '/api/posts/', // Публичный API для отдельных постов
  '/api/user' // Публичный API для пользователей
] as const

// Функция для проверки пути с учетом локали
const isPublicPath = (path: string, route: string): boolean => {
  if (route === '/' && path === '/') {
    return true
  }
  return route !== '/' && path.startsWith(route)
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method || 'GET'
  const path = event.path

  // Проверяем, является ли текущий путь публичным
  const isPublicRoute = PUBLIC_ROUTES.some(route => isPublicPath(path, route))
  
  if (isPublicRoute) {
    return
  }

  // Проверяем, является ли это GET запросом к публичному маршруту
  const isPublicGetRoute = method === 'GET' && PUBLIC_GET_ROUTES.some(route => isPublicPath(path, route))
  if (isPublicGetRoute) {
    return
  }

  // Проверяем авторизацию
  const authResult = await checkAuth(event)
  
  if (!authResult.isAuthenticated) {
    console.log('Unauthorized access to:', path)
    return sendRedirect(event, '/')
  }

  // // Проверяем верификацию почты
  // if (!authResult.email_verified) {
  //   console.log('Email not verified for:', path)
  //   return sendRedirect(event, '/login?error=email_not_verified')
  // }
}) 