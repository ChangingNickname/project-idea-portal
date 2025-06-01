import { defineEventHandler, createError } from 'h3'
import { checkAuth } from '~~/server/utils/auth'

// Список публичных маршрутов, не требующих авторизации
const PUBLIC_ROUTES = [
  '/', // Главная страница
  '/dashboard', // Дашборд
  '/login', // Страница входа
  '/_nuxt', // Nuxt ассеты
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
] as const

// Маршруты, где GET запросы публичные, а остальные требуют авторизации
const PUBLIC_GET_ROUTES: string[] = []

export default defineEventHandler(async (event) => {
  const method = event.node.req.method || 'GET'
  const path = event.path

  // Проверяем, является ли текущий путь публичным
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    if (route === '/' && path === '/') {
      return true
    }
    return route !== '/' && path.startsWith(route)
  })
  
  if (isPublicRoute) {
    return
  }

  // Проверяем, является ли это GET запросом к публичному маршруту
  const isPublicGetRoute = method === 'GET' && PUBLIC_GET_ROUTES.some(route => path.startsWith(route))
  if (isPublicGetRoute) {
    return
  }

  // Проверяем авторизацию
  const authResult = await checkAuth(event)
  
  if (!authResult.isAuthenticated) {
    console.log('Unauthorized access to:', path)
    return sendRedirect(event, '/login')
    throw createError({
      statusCode: 401,
      message: 'Требуется авторизация',
      data: {
        redirect: '/login'
      }
    })
  }
}) 