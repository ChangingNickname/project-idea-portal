import { defineStore } from 'pinia'
import { useUserStore } from '~/stores/user'

interface ArticleBuilderState {
  showCreate: boolean
  showPreview: boolean
  leftPanel: 'create' | 'preview' | null
  rightPanel: 'create' | 'preview' | null
  draft: Partial<Post>
}

export const useArticleBuilderStore = defineStore('articleBuilder', {
  state: (): ArticleBuilderState => {
    const userStore = useUserStore()
    return {
      showCreate: true,
      showPreview: false,
      leftPanel: 'create',
      rightPanel: null,
      draft: {
        title: '',
        cover: null,
        annotation: '',
        keywords: [],
        domain: '',
        content: '',
        status: 'draft',
        executionPolicy: 'public',
        participants: [],
        currentParticipants: 0,
        views: 0,
        likes: 0,
        comments: 0,
        owner: userStore.user || undefined,
        ownerId: userStore.user?.id,
        author: userStore.user ? [userStore.user] : [],
        authorId: userStore.user ? [userStore.user.id] : []
      }
    }
  },

  actions: {
    toggleCreate() {
      this.showCreate = !this.showCreate
      this.updatePanels()
    },

    togglePreview() {
      this.showPreview = !this.showPreview
      this.updatePanels()
    },

    updatePanels() {
      if (this.showCreate && this.showPreview) {
        // Если оба окна активны, распределяем их
        this.leftPanel = 'create'
        this.rightPanel = 'preview'
      } else if (this.showCreate) {
        // Если только создание активно
        this.leftPanel = 'create'
        this.rightPanel = null
      } else if (this.showPreview) {
        // Если только превью активно
        this.leftPanel = 'preview'
        this.rightPanel = null
      } else {
        // Если оба окна неактивны
        this.leftPanel = null
        this.rightPanel = null
      }
    },

    // Обновление черновика
    updateDraft(updates: Partial<Post>) {
      const userStore = useUserStore()
      const currentUser = userStore.user

      if (currentUser) {
        // Убеждаемся, что владелец всегда установлен
        updates.owner = currentUser
        updates.ownerId = currentUser.id

        // Обрабатываем авторов
        let updatedAuthors = updates.author || this.draft.author || []
        let updatedAuthorIds = updates.authorId || this.draft.authorId || []

        // Если владелец не в списке авторов, добавляем его
        if (!updatedAuthors.some(a => a?.id === currentUser.id)) {
          updatedAuthors = [currentUser, ...updatedAuthors]
          updatedAuthorIds = [currentUser.id, ...updatedAuthorIds]
        }

        updates.author = updatedAuthors
        updates.authorId = updatedAuthorIds
      }

      this.draft = {
        ...this.draft,
        ...updates,
        updatedAt: new Date().toISOString()
      } as Partial<Post>
    },

    // Сброс черновика
    resetDraft() {
      const userStore = useUserStore()
      this.draft = {
        title: '',
        cover: null,
        annotation: '',
        keywords: [],
        domain: '',
        content: '',
        status: 'draft',
        executionPolicy: 'public',
        participants: [],
        currentParticipants: 0,
        views: 0,
        likes: 0,
        comments: 0,
        owner: userStore.user || undefined,
        ownerId: userStore.user?.id,
        author: userStore.user ? [userStore.user] : [],
        authorId: userStore.user ? [userStore.user.id] : []
      }
    }
  }
}) 