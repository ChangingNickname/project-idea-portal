import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { checkAuth } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const db = getFirestore()
  const auth = getAuth()

  // Проверяем авторизацию
  const authResult = await checkAuth(event)
  if (!authResult.isAuthenticated || !authResult.currentUserId) {
    throw createError({
      statusCode: 401,
      message: 'Требуется авторизация'
    })
  }

  try {
    const query = getQuery(event)
    const searchQuery = (query.q as string) || ''
    const showBlocked = query.showBlocked === 'true'
    const friendsFirst = query.friendsFirst !== 'false'
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10

    // Получаем список друзей текущего пользователя
    const friendsSnapshot = await db.collection('relationships')
      .where('uid', '==', authResult.currentUserId)
      .where('status', '==', 'friend')
      .get()

    const friendIds = friendsSnapshot.docs.map(doc => doc.data().targetUid)

    // Получаем список заблокированных пользователей
    const blockedSnapshot = await db.collection('relationships')
      .where('uid', '==', authResult.currentUserId)
      .where('status', '==', 'blacklist')
      .get()

    const blockedIds = blockedSnapshot.docs.map(doc => doc.data().targetUid)

    // Получаем список друзей друзей
    const friendsOfFriendsSnapshot = await db.collection('relationships')
      .where('uid', 'in', friendIds.length > 0 ? friendIds : ['none'])
      .where('status', '==', 'friend')
      .get()

    const friendsOfFriendsIds = friendsOfFriendsSnapshot.docs
      .map(doc => doc.data().targetUid)
      .filter(id => id !== authResult.currentUserId && !friendIds.includes(id))

    // Получаем все профили пользователей
    const profilesSnapshot = await db.collection('profiles').get()
    const profilesMap = new Map(
      profilesSnapshot.docs.map(doc => [doc.data().uid, doc.data()])
    )

    // Получаем всех пользователей из Firebase Auth
    const listUsersResult = await auth.listUsers()
    const userRecords = listUsersResult.users

    // Создаем мапу пользователей
    const usersMap = new Map(
      userRecords.map(user => [
        user.uid,
        {
          id: user.uid,
          email: user.email || null,
          avatar: profilesMap.get(user.uid)?.avatar || user.photoURL || null,
          emailVerified: user.emailVerified,
          displayName: profilesMap.get(user.uid)?.displayName || user.displayName || null,
          disabled: user.disabled,
          isAnonymous: user.providerData.length === 0,
          providerData: user.providerData.map(provider => ({
            providerId: provider.providerId,
            uid: provider.uid,
            displayName: provider.displayName || null,
            email: provider.email || null,
            phoneNumber: provider.phoneNumber || null,
            photoURL: provider.photoURL || null
          })),
          customClaims: user.customClaims || null,
          metadata: {
            creationTime: user.metadata.creationTime || null,
            lastSignInTime: user.metadata.lastSignInTime || null,
            lastRefreshTime: user.metadata.lastRefreshTime || null
          },
          tenantId: user.tenantId || null,
          multiFactor: user.multiFactor ? {
            enrolledFactors: user.multiFactor.enrolledFactors.map(factor => ({
              uid: factor.uid,
              factorId: factor.factorId,
              displayName: factor.displayName || null,
              enrollmentTime: factor.enrollmentTime || null
            }))
          } : null,
          contacts: profilesMap.get(user.uid)?.contacts || {
            email: user.email || null,
            phone: null,
            telegram: null,
            whatsapp: null,
            viber: null,
            discord: null,
            linkedin: null,
            github: null,
            website: null
          }
        }
      ])
    )

    // Фильтруем и сортируем результаты
    let results = Array.from(usersMap.values())
      .filter(user => {
        // Проверяем соответствие поисковому запросу
        const matchesSearch = !searchQuery.trim() || 
          user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()))

        // Проверяем, не заблокирован ли пользователь
        const isBlocked = blockedIds.includes(user.id)
        if (isBlocked && !showBlocked) {
          return false
        }

        return matchesSearch
      })

    // Сортируем результаты
    if (friendsFirst) {
      results.sort((a, b) => {
        const aIsFriend = friendIds.includes(a.id)
        const bIsFriend = friendIds.includes(b.id)
        const aIsFriendOfFriend = friendsOfFriendsIds.includes(a.id)
        const bIsFriendOfFriend = friendsOfFriendsIds.includes(b.id)

        if (aIsFriend && !bIsFriend) return -1
        if (!aIsFriend && bIsFriend) return 1
        if (aIsFriendOfFriend && !bIsFriendOfFriend) return -1
        if (!aIsFriendOfFriend && bIsFriendOfFriend) return 1
        return 0
      })
    }

    // Применяем пагинацию
    const total = results.length
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedResults = results.slice(start, end)

    return {
      users: paginatedResults,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    console.error('Ошибка поиска пользователей:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Внутренняя ошибка сервера'
    })
  }
})
