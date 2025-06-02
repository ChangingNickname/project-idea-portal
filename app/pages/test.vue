<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold mb-8">Тест карточки поста</h1>
      
      <div class="grid gap-6">
        <!-- Тестовая карточка с одним автором -->
        <PostsCard
          v-if="testPost"
          :post="testPost"
        />

        <!-- Тестовая карточка с несколькими авторами -->
        <PostsCard
          v-if="testPostWithMultipleAuthors"
          :post="testPostWithMultipleAuthors"
        />

        <!-- Тестовая карточка с несколькими авторами (полный режим) -->
        <PostsCard
          v-if="testPostWithMultipleAuthors"
          :post="testPostWithMultipleAuthors"
          :is-full="true"
        />

        <!-- Тестовая карточка без данных (состояние загрузки) -->
        <PostsCard :post="null" />

        <!-- Полная страница поста -->
        <div class="mt-12 pt-12 border-t border-gray-200 dark:border-gray-800">
          <h2 class="text-2xl font-bold mb-8">Тест полной страницы поста</h2>
          <PostsFull
            v-if="testPostWithMultipleAuthors"
            :post="testPostWithMultipleAuthors"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import PostsCard from '~/components/posts/card.vue'
import PostsFull from '~/components/posts/full.vue'

// Расширяем тип User для тестовых данных
type TestUser = {
  id: string
  displayName: string | null
  avatar: string | null
  role?: string
  company?: string
}

const userStore = useUserStore()
const currentUser = computed(() => userStore.user)

// Тестовый пост с одним автором
const testPost = computed(() => {
  if (!currentUser.value) return null

  return {
    id: '1',
    title: 'Разработка системы управления проектами с использованием Vue.js и Firebase',
    cover: 'https://picsum.photos/800/400',
    annotation: 'В данной статье рассматривается процесс разработки современной системы управления проектами с использованием Vue.js 3 и Firebase. Особое внимание уделяется архитектуре приложения, управлению состоянием и интеграции с облачными сервисами.',
    author: currentUser.value,
    authorId: currentUser.value.id,
    keywords: ['Vue.js', 'Firebase', 'TypeScript', 'Nuxt 3', 'Tailwind CSS'],
    domain: 'Web Development',
    content: `
# Разработка системы управления проектами

## Введение

В современном мире разработки программного обеспечения эффективное управление проектами является ключевым фактором успеха. В данной статье мы рассмотрим процесс создания системы управления проектами с использованием современных технологий.

## Используемые технологии

- Vue.js 3
- Firebase
- TypeScript
- Nuxt 3
- Tailwind CSS

## Архитектура приложения

Приложение построено на основе компонентной архитектуры Vue.js 3 с использованием Composition API. Для управления состоянием используется Pinia, а для маршрутизации - Vue Router.

\`\`\`typescript
// Пример кода
import { defineComponent } from 'vue'
import { useStore } from 'pinia'

export default defineComponent({
  setup() {
    const store = useStore()
    return { store }
  }
})
\`\`\`

## Интеграция с Firebase

Firebase предоставляет все необходимые инструменты для создания полноценного backend'а:
- Authentication для управления пользователями
- Firestore для хранения данных
- Storage для файлов
- Cloud Functions для серверной логики

## Заключение

Разработка системы управления проектами с использованием Vue.js и Firebase позволяет создать современное, масштабируемое и удобное в использовании приложение.
    `,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'published' as const,
    views: 1234,
    likes: 56,
    comments: 23,
    executionPolicy: 'public' as const,
    currentParticipants: 5,
    participants: []
  }
})

// Тестовый пост с несколькими авторами
const testPostWithMultipleAuthors = computed(() => {
  if (!currentUser.value) return null

  // Создаем массив тестовых авторов
  const authors: TestUser[] = [
    currentUser.value,
    {
      id: '2',
      displayName: 'Анна Петрова',
      avatar: 'https://i.pravatar.cc/150?img=2',
      role: 'Frontend Developer',
      company: 'Tech Solutions'
    },
    {
      id: '3',
      displayName: 'Иван Сидоров',
      avatar: 'https://i.pravatar.cc/150?img=3',
      role: 'Backend Developer',
      company: 'Tech Solutions'
    },
    {
      id: '4',
      displayName: 'Мария Иванова',
      avatar: 'https://i.pravatar.cc/150?img=4',
      role: 'UI/UX Designer',
      company: 'Design Studio'
    },
    {
      id: '5',
      displayName: 'Алексей Смирнов',
      avatar: 'https://i.pravatar.cc/150?img=5',
      role: 'DevOps Engineer',
      company: 'Cloud Systems'
    }
  ]

  return {
    ...testPost.value,
    id: '2',
    title: 'Совместная разработка микросервисной архитектуры',
    cover: 'https://picsum.photos/800/401',
    annotation: 'В этой статье мы рассказываем о нашем опыте разработки микросервисной архитектуры в команде из пяти специалистов. Рассматриваем процесс принятия решений, распределение задач и инструменты, которые помогли нам в работе.',
    author: authors,
    authorId: authors.map(a => a.id),
    keywords: ['Microservices', 'Team Collaboration', 'DevOps', 'Cloud', 'Architecture'],
    content: `
# Совместная разработка микросервисной архитектуры

## Введение

Разработка микросервисной архитектуры требует слаженной работы команды специалистов. В этой статье мы делимся нашим опытом и лучшими практиками.

## Наша команда

- Frontend Developer: Анна Петрова
- Backend Developer: Иван Сидоров
- UI/UX Designer: Мария Иванова
- DevOps Engineer: Алексей Смирнов
- Team Lead: ${currentUser.value.displayName}

## Процесс разработки

Каждый член команды отвечал за свой участок работы, но мы регулярно проводили совместные обсуждения для обеспечения согласованности решений.

## Результаты

Благодаря слаженной работе команды нам удалось создать масштабируемую и надежную систему.
    `,
    views: 2345,
    likes: 123,
    comments: 45,
    currentParticipants: 5,
    participants: authors.map(a => a.id)
  } as Post
})
</script>
