import { defineStore } from 'pinia'

interface ArticleBuilderState {
  showCreate: boolean
  showPreview: boolean
  leftPanel: 'create' | 'preview' | null
  rightPanel: 'create' | 'preview' | null
  draft: Partial<Post> // Черновик поста
}

export const useArticleBuilderStore = defineStore('articleBuilder', {
  state: (): ArticleBuilderState => ({
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
      comments: 0
    }
  }),

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
      this.draft = {
        ...this.draft,
        ...updates,
        updatedAt: new Date().toISOString()
      }
    },

    // Сброс черновика
    resetDraft() {
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
        comments: 0
      }
    }
  }
}) 