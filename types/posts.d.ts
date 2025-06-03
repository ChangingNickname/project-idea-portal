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
        domain: string
        content: string
        createdAt: string
        updatedAt: string
        status: 'draft' | 'published' | 'archived'
        views: number // Количество просмотров
        likes: number // Количество лайков
        deadline?: string
        executionPolicy: 'contest' | 'public'
        maxParticipants?: number
        participants: {
            userId: string
            user: User
            status: 'pending' | 'approved' | 'rejected'
            joinedAt: string
            approvedAt?: string
            approvedBy?: string
        }[]
        currentParticipants: number
        viewedBy: string[] // ID пользователей, просмотревших пост
    }
}
