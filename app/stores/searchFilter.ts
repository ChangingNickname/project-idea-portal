import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

interface SearchFilterState {
  selectedAuthors: string[]
  title: string
  domain: string
  keywords: string
  dateRange: {
    start: Date | null
    end: Date | null
  }
}

export const useSearchFilterStore = defineStore('searchFilter', () => {
  const selectedAuthors = useStorage<string[]>('searchFilter-authors', [])
  const title = useStorage<string>('searchFilter-title', '')
  const domain = useStorage<string>('searchFilter-domain', '')
  const keywords = useStorage<string>('searchFilter-keywords', '')
  const dateRange = useStorage<{ start: Date | null; end: Date | null }>('searchFilter-dateRange', {
    start: null,
    end: null
  })

  function setSelectedAuthors(authors: string[]) {
    selectedAuthors.value = authors
  }

  function addAuthor(authorId: string) {
    if (!selectedAuthors.value.includes(authorId)) {
      selectedAuthors.value.push(authorId)
    }
  }

  function removeAuthor(authorId: string) {
    selectedAuthors.value = selectedAuthors.value.filter((id: string) => id !== authorId)
  }

  function setTitle(newTitle: string) {
    title.value = newTitle
  }

  function setDomain(newDomain: string) {
    domain.value = newDomain
  }

  function setKeywords(newKeywords: string) {
    keywords.value = newKeywords
  }

  function setDateRange(start: Date | null, end: Date | null) {
    dateRange.value = { start, end }
  }

  function reset() {
    selectedAuthors.value = []
    title.value = ''
    domain.value = ''
    keywords.value = ''
    dateRange.value = {
      start: null,
      end: null
    }
  }

  return {
    selectedAuthors,
    title,
    domain,
    keywords,
    dateRange,
    setSelectedAuthors,
    addAuthor,
    removeAuthor,
    setTitle,
    setDomain,
    setKeywords,
    setDateRange,
    reset
  }
}) 