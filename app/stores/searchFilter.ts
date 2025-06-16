import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

interface SearchFilterState {
  subjectAreas: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  selectedAuthors: string[]
}

export const useSearchFilterStore = defineStore('searchFilter', {
  state: (): SearchFilterState => ({
    subjectAreas: [],
    dateRange: {
      start: null,
      end: null
    },
    selectedAuthors: []
  }),

  actions: {
    setSubjectAreas(newSubjectAreas: string[]) {
      this.subjectAreas = newSubjectAreas
    },

    setDateRange(start: Date | null, end: Date | null) {
      this.dateRange = { start, end }
    },

    setSelectedAuthors(authors: string[]) {
      this.selectedAuthors = authors
    },

    reset() {
      this.subjectAreas = []
      this.dateRange = {
        start: null,
        end: null
      }
      this.selectedAuthors = []
    }
  }
}) 