export {}

declare global {
    interface Post {
        id: string
        title: string
        cover: string | null // base64 string
        annotation: string
        owner: User // Владелец поста
        ownerId: string // ID владельца
        author: User[] // Список авторов (включая владельца)
        authorId: string[] // ID авторов (включая владельца)
        keywords: string[]
        subjectAreas: Array<{
            key: string
            i18nKey: string
        }>
        content: string
        createdAt: string
        updatedAt: string
        status: 'draft' | 'published' | 'archived'
        views: number // Количество просмотров
        likes: number // Количество лайков
        deadline?: string
        viewedBy: string[] // ID пользователей, просмотревших пост
    }
}
