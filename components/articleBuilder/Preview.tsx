'use client';

import { useEffect, useState } from 'react';
import { FullPost } from '../posts/FullPost';
import { Post } from '../../types/posts';
import { Switch } from '@heroui/switch';

const STORAGE_KEYS = {
  title: 'article-builder-title',
  tags: 'article-builder-tags',
  shortDesc: 'article-builder-short-desc',
  image: 'article-builder-image',
  content: 'article-builder-content'
};

// Custom event for preview updates
export const PREVIEW_UPDATE_EVENT = 'preview-update';

export default function Preview() {
  const [post, setPost] = useState<Post | null>(null);
  const [isLivePreview, setIsLivePreview] = useState(true);

  const updatePreview = () => {
    const title = localStorage.getItem(STORAGE_KEYS.title) || '';
    const tags = localStorage.getItem(STORAGE_KEYS.tags) || '[]';
    const shortDesc = localStorage.getItem(STORAGE_KEYS.shortDesc) || '';
    const image = localStorage.getItem(STORAGE_KEYS.image) || '';
    const content = localStorage.getItem(STORAGE_KEYS.content) || '';

    setPost(prev => prev ? {
      ...prev,
      name: title,
      tags: JSON.parse(tags),
      shortDesc: shortDesc,
      fullDesc: content,
      image: image
    } : {
      id: 'preview',
      name: title,
      tags: JSON.parse(tags),
      shortDesc: shortDesc,
      fullDesc: content,
      image: image,
      authorId: 'preview',
      email: 'preview@example.com',
      createdAt: new Date().toISOString(),
      status: 'draft'
    });
  };

  // Initial load
  useEffect(() => {
    updatePreview();
  }, []);

  // Listen for preview updates
  useEffect(() => {
    if (!isLivePreview) return;

    const handlePreviewUpdate = () => {
      updatePreview();
    };

    window.addEventListener(PREVIEW_UPDATE_EVENT, handlePreviewUpdate);
    window.addEventListener('storage', handlePreviewUpdate);
    
    return () => {
      window.removeEventListener(PREVIEW_UPDATE_EVENT, handlePreviewUpdate);
      window.removeEventListener('storage', handlePreviewUpdate);
    };
  }, [isLivePreview]);

  if (!post) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 p-4 border-b">
          <h2 className="text-lg font-semibold">Preview</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="prose max-w-none">
            <p>Start editing to see preview...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Preview</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Live Preview</span>
          <Switch
            size="sm"
            isSelected={isLivePreview}
            onValueChange={setIsLivePreview}
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <FullPost post={post} />
      </div>
    </div>
  );
} 