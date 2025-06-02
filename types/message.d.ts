export {}

declare global {
  interface Message {
    id: string
    user: User
    message: string
    timestamp: number
    roomId: string
    type: 'text' | 'code' | 'image' | 'file'
    status: 'sent' | 'delivered' | 'read' | 'error'
    metadata?: {
      language?: string
      fileName?: string
      fileSize?: number
      fileType?: string
      imageUrl?: string
      codeBlock?: {
        language: string
        code: string
      }
    }
    }

    interface MessageProps {
      user: User
      message: string
      timestamp: number
    }

    interface MessageEmits {
      (e: 'edit', messageId: string): void
      (e: 'delete', messageId: string): void
      (e: 'reply', messageId: string): void
    }

      interface MessageState {
      isEditing: boolean
      isDeleting: boolean
      isReplying: boolean
      editContent: string
      error: string | null
    }
}