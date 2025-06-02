export {}

declare global {
  interface Message {
    id: string
    from_user_id: string
    to_user_id: string
    message: string
    type: 'text' | 'code' | 'image' | 'file'
    metadata?: Record<string, any>
    created_at: string
    updated_at: string
    read_at: string | null
    read_by: Array<{
      userId: string
      timestamp: number
    }>
    status: 'sending' | 'sent' | 'delivered' | 'read' | 'error'
    timestamp: number
  }

  interface MessageProps {
    id: string
    user: User
    message: string
    timestamp: number
    status: 'sending' | 'sent' | 'delivered' | 'read' | 'error'
    readBy?: {
      userId: string
      timestamp: number
    }[]
  }

  interface MessageEmits {
    (e: 'edit', messageId: string): void
    (e: 'delete', messageId: string): void
    (e: 'reply', messageId: string): void
    (e: 'markAsRead', messageId: string): void
  }

  interface MessageState {
    isEditing: boolean
    isDeleting: boolean
    isReplying: boolean
    editContent: string
    error: string | null
    isRead: boolean
  }
}