import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const pageToken = searchParams.get('pageToken') || '';
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10')); // Минимум 1
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const startDate = searchParams.get('startDate')?.trim() || '';
    const endDate = searchParams.get('endDate')?.trim() || '';

    console.log('Search posts request:', { query, pageToken, limit, tags, startDate, endDate });

    // Базовый запрос
    let postsQuery = db.collection('posts');

    // Фильтрация по дате только если даты валидные
    if (startDate && !isNaN(Date.parse(startDate))) {
      postsQuery = postsQuery.where('createdAt', '>=', new Date(startDate));
    }
    if (endDate && !isNaN(Date.parse(endDate))) {
      postsQuery = postsQuery.where('createdAt', '<=', new Date(endDate));
    }

    // Получаем все посты для фильтрации
    const snapshot = await postsQuery
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    // Если запрос пустой и нет фильтров, возвращаем последние посты
    if (!query.trim() && tags.length === 0 && !startDate && !endDate) {
      console.log('Empty query and filters, fetching latest posts');
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('Fetched posts count:', posts.length);
      return NextResponse.json({
        posts,
        pageToken: snapshot.docs[snapshot.docs.length - 1]?.id || ''
      });
    }

    // Поиск по тексту и тегам
    console.log('Searching posts with query:', query);
    const lowerQuery = query.toLowerCase();
    
    const filteredPosts = snapshot.docs
      .map(doc => {
        const post = doc.data();
        const text = `${post.name ?? post.title ?? ''} ${post.shortDesc ?? ''} ${post.fullDesc ?? ''} ${(post.tags ?? []).join(' ')}`.toLowerCase();
        
        // Проверяем совпадение с запросом
        const queryMatch = !query.trim() || text.includes(lowerQuery);
        
        // Проверяем совпадение с тегами
        const tagsMatch = tags.length === 0 || tags.some(tag => 
          (post.tags ?? []).some((postTag: string) => 
            postTag.toLowerCase().includes(tag.toLowerCase())
          )
        );

        if (!queryMatch || !tagsMatch) return null;

        // Вычисляем релевантность
        const relevance = calculateRelevance(text, lowerQuery, post.tags ?? [], tags);

        // Используем title как name, если name отсутствует
        const name = post.name ?? post.title ?? '';

        return {
          id: doc.id,
          name,
          shortDesc: post.shortDesc ?? '',
          fullDesc: post.fullDesc ?? '',
          tags: post.tags ?? [],
          image: post.image ?? '',
          createdAt: post.createdAt ? (post.createdAt.toDate?.()?.toISOString() ?? null) : null,
          updatedAt: post.updatedAt ? (post.updatedAt.toDate?.()?.toISOString() ?? null) : null,
          relevance,
          authorId: post.authorId ?? null,
          status: post.status ?? 'Open',
          views: post.views ?? 0,
          likes: post.likes ?? 0,
          comments: post.comments ?? 0,
          // Добавляем все остальные поля
          ...post
        };
      })
      .filter((post): post is NonNullable<typeof post> => post !== null)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    console.log('Found posts count:', filteredPosts.length);
    return NextResponse.json({
      posts: filteredPosts,
      pageToken: snapshot.docs[snapshot.docs.length - 1]?.id || ''
    });
  } catch (error) {
    console.error('Search posts error:', error);
    return NextResponse.json(
      { error: 'Failed to search posts' },
      { status: 500 }
    );
  }
}

// Функция для вычисления релевантности
function calculateRelevance(text: string, query: string, postTags: string[], searchTags: string[]): number {
  let relevance = 0;

  // Релевантность по тексту
  if (query) {
    // Точное совпадение
    if (text.includes(query)) {
      relevance += 10;
    }
    
    // Частичные совпадения
    const words = query.split(' ').filter(Boolean);
    words.forEach(word => {
      if (text.includes(word)) {
        relevance += 2;
      }
    });
  }

  // Релевантность по тегам
  if (searchTags.length > 0) {
    searchTags.forEach(tag => {
      postTags.forEach(postTag => {
        if (postTag.toLowerCase().includes(tag.toLowerCase())) {
          relevance += 5;
        }
      });
    });
  }

  return relevance;
}
