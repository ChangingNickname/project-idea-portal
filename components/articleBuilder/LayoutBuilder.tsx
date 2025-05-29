'use client';

import { useState, useEffect } from 'react';
import Editor from './Editor';
import Preview, { PREVIEW_UPDATE_EVENT } from './Preview';
import AIAgent from './AIAgent';
import { Card } from '@heroui/card';
import { Button } from '@heroui/button';
import { addToast } from '@heroui/toast';

type WindowType = 'editor' | 'preview' | 'ai';

interface LayoutBuilderProps {
  visibleWindows: WindowType[];
}

const STORAGE_KEYS = {
  editor: 'article-builder-editor-visible',
  preview: 'article-builder-preview-visible',
  ai: 'article-builder-ai-visible',
  title: 'article-builder-title',
  tags: 'article-builder-tags',
  shortDesc: 'article-builder-short-desc',
  image: 'article-builder-image',
  content: 'article-builder-content',
  postId: 'article-builder-post-id'
};

// Define the default order of windows
const DEFAULT_ORDER: WindowType[] = ['editor', 'ai', 'preview'];

export default function LayoutBuilder({ visibleWindows }: LayoutBuilderProps) {
  const [savedWindows, setSavedWindows] = useState<WindowType[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Load saved windows and post data on mount
  useEffect(() => {
    const windows: WindowType[] = [];
    // Check if any window was previously shown
    const hasAnyWindow = Object.values(STORAGE_KEYS).some(key => 
      localStorage.getItem(key) === 'true'
    );
    
    // If no windows were shown before, use default order
    if (!hasAnyWindow) {
      windows.push(...DEFAULT_ORDER);
      // Save default windows to localStorage
      DEFAULT_ORDER.forEach(window => {
        localStorage.setItem(STORAGE_KEYS[window], 'true');
      });
    } else {
      // Use DEFAULT_ORDER to maintain consistent window order
      DEFAULT_ORDER.forEach(window => {
        if (localStorage.getItem(STORAGE_KEYS[window]) === 'true') {
          windows.push(window);
        }
      });
    }

    // Load post ID
    const savedPostId = localStorage.getItem(STORAGE_KEYS.postId);
    setPostId(savedPostId);
    
    setSavedWindows(windows);
    setIsInitialized(true);
  }, []);

  // Update savedWindows and localStorage when visibleWindows changes
  useEffect(() => {
    if (!isInitialized) return;
    
    // Sort visibleWindows according to DEFAULT_ORDER
    const sortedWindows = DEFAULT_ORDER.filter(window => 
      visibleWindows.includes(window)
    );
    
    setSavedWindows(sortedWindows);
    // Save each window's visibility state
    localStorage.setItem(STORAGE_KEYS.editor, visibleWindows.includes('editor').toString());
    localStorage.setItem(STORAGE_KEYS.preview, visibleWindows.includes('preview').toString());
    localStorage.setItem(STORAGE_KEYS.ai, visibleWindows.includes('ai').toString());
  }, [visibleWindows, isInitialized]);

  const handleReset = () => {
    if (!postId) return;
    
    if (window.confirm('Are you sure you want to create a new article? All unsaved changes will be lost.')) {
      // Clear post data from localStorage only if explicitly requested
      if (window.confirm('Do you want to clear all saved data?')) {
        localStorage.removeItem(STORAGE_KEYS.title);
        localStorage.removeItem(STORAGE_KEYS.tags);
        localStorage.removeItem(STORAGE_KEYS.shortDesc);
        localStorage.removeItem(STORAGE_KEYS.image);
        localStorage.removeItem(STORAGE_KEYS.content);
        localStorage.removeItem(STORAGE_KEYS.postId);

        // Dispatch storage event to notify other components
        window.dispatchEvent(new StorageEvent('storage', {
          key: null,
          newValue: null,
          oldValue: null,
          storageArea: localStorage
        }));
      }
      
      setPostId(null);
      setLastSync(null);
      
      addToast({
        title: 'Reset',
        description: 'Starting new article',
        color: 'success'
      });
    }
  };

  const handleRefresh = async () => {
    if (!postId) return;

    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (!res.ok) throw new Error('Failed to fetch post data');
      
      const post = await res.json();
      console.log(post);
      
      // Map server fields to localStorage fields
      localStorage.setItem(STORAGE_KEYS.title, post.title || '');
      localStorage.setItem(STORAGE_KEYS.tags, JSON.stringify(post.tags || []));
      localStorage.setItem(STORAGE_KEYS.shortDesc, post.shortDesc || '');
      localStorage.setItem(STORAGE_KEYS.image, post.image || '');
      localStorage.setItem(STORAGE_KEYS.content, post.fullDesc || '');
      
      // Dispatch storage event to notify other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: null,
        newValue: null,
        oldValue: null,
        storageArea: localStorage
      }));
      
      setLastSync(new Date());
      
      addToast({
        title: 'Refreshed',
        description: 'Post data updated from server',
        color: 'success'
      });
    } catch (err) {
      addToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to refresh post data',
        color: 'danger'
      });
    }
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </Card>
    );
  }

  // If no windows are visible, show a message
  if (savedWindows.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Select a window to start working</p>
          <p className="text-sm mt-2">Use the buttons above to show Editor, Preview, or AI Agent</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 flex items-center justify-between border-b">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {postId ? `Editing post: ${postId}` : 'Creating new post'}
          </div>
          {postId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
            >
              Create New
            </Button>
          )}
        </div>
        {postId && (
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {lastSync ? `Last sync: ${lastSync.toLocaleTimeString()}` : 'Not synced'}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </div>
        )}
      </div>
      <div 
        className="grid flex-1" 
        style={{
          gridTemplateColumns: `repeat(${savedWindows.length}, 1fr)`,
          gap: '1px'
        }}
      >
        {savedWindows.map((window) => (
          <div key={window} className="h-full overflow-hidden">
            <Card className="h-full border-0 rounded-none flex flex-col">
              <div className="flex-1 overflow-auto">
                {window === 'editor' && <Editor />}
                {window === 'ai' && <AIAgent />}
                {window === 'preview' && <Preview />}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
} 