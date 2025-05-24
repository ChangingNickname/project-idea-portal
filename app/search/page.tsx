'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { UserCard } from '@/components/user/UserCard';
import { User } from '@/types/user';
import { useInView } from 'react-intersection-observer';
import { SearchIcon } from '@/components/icons';

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 5;
const SEARCH_DELAY = 1500; // 1.5 секунды

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { ref, inView } = useInView();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSearchTimeRef = useRef<number>(0);
  const isInitialLoad = useRef(true);

  // Загрузка истории поиска из localStorage
  useEffect(() => {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Сохранение поискового запроса в историю
  const saveToHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const newHistory = [searchQuery, ...searchHistory.filter(q => q !== searchQuery)]
      .slice(0, MAX_HISTORY_ITEMS);
    
    setSearchHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  }, [searchHistory]);

  // Очистка истории поиска
  const clearHistory = useCallback(() => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    setSearchHistory([]);
  }, []);

  const searchUsers = useCallback(async (searchQuery: string, token: string | null = null) => {
    const now = Date.now();
    if (now - lastSearchTimeRef.current < SEARCH_DELAY) {
      return;
    }
    lastSearchTimeRef.current = now;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/user/search?q=${encodeURIComponent(searchQuery)}${
          token ? `&pageToken=${token}` : ''
        }`
      );

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          setError(`Too many requests. Please wait ${data.retryAfter} seconds`);
        } else {
          throw new Error('Failed to fetch users');
        }
        return;
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response:', text);
        throw new Error('Invalid response from server');
      }

      if (!data || !Array.isArray(data.users)) {
        throw new Error('Invalid response format');
      }

      setUsers(prev => (token ? [...prev, ...data.users] : data.users));
      setPageToken(data.pageToken);
      setHasMore(!!data.pageToken);
      if (searchQuery.trim()) {
        saveToHistory(searchQuery);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [saveToHistory]);

  // Обработка изменения поискового запроса
  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    
    // Очищаем предыдущий таймаут
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Устанавливаем новый таймаут
    searchTimeoutRef.current = setTimeout(() => {
      router.push(`/search?q=${encodeURIComponent(newQuery)}`);
      searchUsers(newQuery);
    }, SEARCH_DELAY);
  };

  // Начальный поиск при загрузке страницы
  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      searchUsers(initialQuery);
    } else if (isInitialLoad.current) {
      // При первом входе на страницу без поискового запроса
      searchUsers('');
      isInitialLoad.current = false;
    }
  }, [searchParams, searchUsers]);

  const handleLoadMore = () => {
    if (!hasMore || loading || !pageToken) return;
    searchUsers(query, pageToken);
  };

  // Загрузка следующей страницы при скролле
  useEffect(() => {
    if (inView && hasMore && !loading && query) {
      searchUsers(query, pageToken);
    }
  }, [inView, hasMore, loading, query, pageToken, searchUsers]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-4 mb-8">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by email or UID..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full"
            startContent={<SearchIcon className="text-default-400" />}
          />
        </div>
      </div>

      {searchHistory.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Recent Searches</h2>
            <Button
              size="sm"
              color="danger"
              variant="light"
              onClick={clearHistory}
            >
              Clear History
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => handleQueryChange(item)}
                className="px-3 py-1 bg-default-100 rounded-full text-sm hover:bg-default-200"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-danger-50 text-danger-500 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {users.map((user) => (
          <UserCard key={user.uid} user={user} />
        ))}
      </div>

      {hasMore && !loading && users.length > 0 && (
        <div className="mt-8 text-center">
          <Button
            onClick={handleLoadMore}
            color="primary"
            variant="ghost"
            isLoading={loading}
          >
            Load More
          </Button>
        </div>
      )}

      {!loading && users.length === 0 && query && (
        <div className="text-center text-default-500">
          No users found
        </div>
      )}

      <div ref={ref} className="h-10" />
    </div>
  );
} 