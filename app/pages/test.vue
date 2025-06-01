<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold mb-8">Тест сообщения</h1>
      
      <Message
        v-if="currentUser"
        :user="currentUser"
        :message="testMessage"
        :timestamp="Date.now()"
      />
      <div v-else class="text-center text-gray-500">
        Пожалуйста, войдите в систему для просмотра сообщения
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import Message from '~/components/chat/message.vue'

const userStore = useUserStore()
const currentUser = computed(() => userStore.user)

// Тестовое сообщение с разными элементами Markdown
const testMessage = `
# Заголовок сообщения

Это тестовое сообщение с разными элементами Markdown:

## Подзаголовок

- Список
- С разными
- Элементами

\`\`\`javascript
// Пример кода
const hello = 'world';
console.log(hello);
\`\`\`

> Цитата из какого-то текста

[Ссылка на GitHub](https://github.com)

**Жирный текст** и *курсив*

| Таблица | Пример |
|---------|---------|
| Ячейка 1 | Ячейка 2 |
| Ячейка 3 | Ячейка 4 |
`
</script>
