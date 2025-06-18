import { defineStore } from 'pinia'
import { useUserStore } from '~/stores/user'

interface ArticleBuilderState {
  showCreate: boolean
  showPreview: boolean
  showAiAgent: boolean
  leftPanel: 'create' | 'preview' | null
  rightPanel: 'create' | 'preview' | null
  draft: Partial<Post>
  isEditing: boolean
  lastExternalUpdate: number
  isMobile: boolean
  title: string
  cover: string | null
  annotation: string
  content: string
  keywords: string[]
  subjectAreas: Array<{
    key: string
    i18nKey: string
  }>
  status: 'draft' | 'published' | 'archived'
  deadline?: string
}

const STORAGE_KEY = 'article_builder_panels'

// Функция для загрузки состояния из sessionStorage
const loadPanelState = (): Partial<ArticleBuilderState> => {
  if (process.server) return {}
  
  try {
    const storedState = sessionStorage.getItem(STORAGE_KEY)
    return storedState ? JSON.parse(storedState) : {}
  } catch (error) {
    console.error('Failed to load article builder state from sessionStorage:', error)
    return {}
  }
}

// Функция для сохранения состояния в sessionStorage
const savePanelState = (state: Partial<ArticleBuilderState>) => {
  if (process.server) return

  try {
    const stateToSave = {
      showCreate: state.showCreate,
      showPreview: state.showPreview,
      showAiAgent: state.showAiAgent,
      leftPanel: state.leftPanel,
      rightPanel: state.rightPanel
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
  } catch (error) {
    console.error('Failed to save article builder state to sessionStorage:', error)
  }
}

export const useArticleBuilderStore = defineStore('articleBuilder', {
  state: (): ArticleBuilderState => {
    const userStore = useUserStore()
    const savedState = loadPanelState()
    
    return {
      showCreate: savedState.showCreate ?? true,
      showPreview: savedState.showPreview ?? false,
      showAiAgent: savedState.showAiAgent ?? false,
      leftPanel: savedState.leftPanel ?? 'create',
      rightPanel: savedState.rightPanel ?? null,
      isEditing: false,
      lastExternalUpdate: 0,
      isMobile: false,
      draft: {
        title: '',
        cover: null,
        annotation: '',
        keywords: [],
        subjectAreas: [],
        status: 'draft',
        views: 0,
        likes: 0,
        owner: userStore.user || undefined,
        ownerId: userStore.user?.id,
        author: userStore.user ? [userStore.user] : [],
        authorId: userStore.user ? [userStore.user.id] : [],
        deadline: undefined
      },
      title: '',
      cover: null,
      annotation: '',
      content: '',
      keywords: [],
      subjectAreas: [],
      status: 'draft',
      deadline: undefined
    }
  },

  actions: {
    setMobileMode(isMobile: boolean) {
      this.isMobile = isMobile
      this.updatePanels()
    },

    toggleCreate() {
      if (this.isMobile) {
        // В мобильном режиме закрываем все остальные панели
        this.showPreview = false
        this.showAiAgent = false
      }
      this.showCreate = !this.showCreate
      this.updatePanels()
      savePanelState(this)
    },

    togglePreview() {
      if (this.isMobile) {
        // В мобильном режиме закрываем все остальные панели
        this.showCreate = false
        this.showAiAgent = false
      }
      this.showPreview = !this.showPreview
      this.updatePanels()
      savePanelState(this)
    },

    toggleAiAgent() {
      if (this.isMobile) {
        // В мобильном режиме закрываем все остальные панели
        this.showCreate = false
        this.showPreview = false
      }
      this.showAiAgent = !this.showAiAgent
      savePanelState(this)
    },

    updatePanels() {
      if (this.isMobile) {
        // В мобильном режиме показываем только одну панель
        if (this.showCreate) {
          this.leftPanel = 'create'
          this.rightPanel = null
        } else if (this.showPreview) {
          this.leftPanel = 'preview'
          this.rightPanel = null
        } else if (this.showAiAgent) {
          this.leftPanel = null
          this.rightPanel = null
        } else {
          this.leftPanel = null
          this.rightPanel = null
        }
      } else {
        // Десктопный режим - старая логика
        if (this.showCreate && this.showPreview) {
          this.leftPanel = 'create'
          this.rightPanel = 'preview'
        } else if (this.showCreate) {
          this.leftPanel = 'create'
          this.rightPanel = null
        } else if (this.showPreview) {
          this.leftPanel = 'preview'
          this.rightPanel = null
        } else {
          this.leftPanel = null
          this.rightPanel = null
        }
      }
      savePanelState(this)
    },

    // Обновление черновика
    updateDraft(updates: Partial<Post>, isExternal: boolean = false) {
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

        // Если текущий пользователь является автором, используем его данные из user store
        updatedAuthors = updatedAuthors.map(author => {
          if (author?.id === currentUser.id) {
            return currentUser
          }
          return author
        })

        updates.author = updatedAuthors
        updates.authorId = updatedAuthorIds
      }

      // Если есть ID, значит это редактирование
      if (updates.id) {
        this.isEditing = true
      }

      // Обновляем черновик
      this.draft = {
        ...this.draft,
        ...updates,
        updatedAt: new Date().toISOString()
      } as Partial<Post>

      // Если это внешнее обновление, обновляем timestamp
      if (isExternal) {
        this.lastExternalUpdate = Date.now()
      }
    },

    // Сброс черновика
    resetDraft() {
      const userStore = useUserStore()
      this.draft = {
        title: '',
        cover: null,
        annotation: '',
        keywords: [],
        subjectAreas: [],
        status: 'draft',
        views: 0,
        likes: 0,
        owner: userStore.user || undefined,
        ownerId: userStore.user?.id,
        author: userStore.user ? [userStore.user] : [],
        authorId: userStore.user ? [userStore.user.id] : [],
        deadline: undefined
      }
      this.isEditing = false
      this.title = ''
      this.cover = null
      this.annotation = ''
      this.content = ''
      this.keywords = []
      this.subjectAreas = []
      this.status = 'draft'
      this.deadline = undefined
    },

    setTitle(title: string) {
      this.title = title
    },

    setCover(cover: string | null) {
      this.cover = cover
    },

    setAnnotation(annotation: string) {
      this.annotation = annotation
    },

    setContent(content: string) {
      this.content = content
    },

    setKeywords(keywords: string[]) {
      this.keywords = keywords
    },

    setSubjectAreas(subjectAreas: Array<{ key: string; i18nKey: string }>) {
      this.subjectAreas = subjectAreas
    },

    setStatus(status: 'draft' | 'published' | 'archived') {
      this.status = status
    },

    setDeadline(deadline?: string) {
      this.deadline = deadline
    },

    async loadPost(id: string) {
      try {
        const response = await $fetch<Post>(`/api/posts/${id}`)
        if (response) {
          // Обновляем черновик с полученными данными
          this.updateDraft({
            id: response.id,
            title: response.title || '',
            cover: response.cover || null,
            annotation: response.annotation || '',
            keywords: response.keywords || [],
            subjectAreas: response.subjectAreas || [],
            content: response.content || '',
            status: response.status || 'draft',
            views: response.views || 0,
            likes: response.likes || 0,
            owner: response.owner,
            ownerId: response.ownerId,
            author: response.author || [],
            authorId: response.authorId || [],
            createdAt: response.createdAt,
            updatedAt: response.updatedAt,
            deadline: response.deadline
          }, true)

          // Обновляем локальные поля
          this.title = response.title || ''
          this.cover = response.cover || null
          this.annotation = response.annotation || ''
          this.content = response.content || ''
          this.keywords = response.keywords || []
          this.subjectAreas = response.subjectAreas || []
          this.status = response.status || 'draft'
          this.deadline = response.deadline

          return response
        }
      } catch (error) {
        console.error('Failed to load post:', error)
        throw error
      }
    }
  }
}) 