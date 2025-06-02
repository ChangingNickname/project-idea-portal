export {}

declare global {
    interface Post {
        id: string
        title: string
        cover: string | null // base64 string
        annotation: string
        author: User | User[] // Поддержка одного или нескольких авторов
        authorId: string | string[] // ID одного или нескольких авторов
        keywords: string[]
        domain: string
        content: string
        createdAt: string
        updatedAt: string
        status: 'draft' | 'published' | 'archived'
        views: number // Количество просмотров
        likes: number // Количество лайков
        comments: number // Количество комментариев

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
    }
}
