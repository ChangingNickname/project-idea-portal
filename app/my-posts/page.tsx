'use client';

import { useEffect, useState } from 'react';
import { Post } from '@/types/posts';
import { PostContainer } from '@/components/posts/PostContainer';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";

export default function MyPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/posts/my-posts?limit=3', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load posts');
        }
        const data = await response.json();
        setPosts(data.posts);
        setPageToken(data.pageToken || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Load more posts
  const fetchMore = async () => {
    if (!pageToken) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/posts/my-posts?limit=3&pageToken=${pageToken}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load more posts');
      }
      const data = await response.json();
      const newPosts = data.posts.filter((newPost: Post) => !posts.some(existingPost => existingPost.id === newPost.id));
      setPosts(prev => [...prev, ...newPosts]);
      setPageToken(data.pageToken || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading && posts.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardBody className="flex justify-center items-center min-h-[200px]">
            <Spinner size="lg" />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold text-red-600">Error</h1>
          </CardHeader>
          <CardBody>
            <p>{error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <h1 className="text-3xl text-center mb-10">My Posts</h1>

      <PostContainer posts={posts} editable={true} onDelete={handleDelete} />
      {pageToken && (
        <div className="flex justify-center mt-8">
          <Button
            className="px-6 py-2 rounded bg-primary text-primary-foreground hover:bg-primary-600 transition"
            onClick={fetchMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
