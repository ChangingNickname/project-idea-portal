'use client';

import { useState, useEffect } from 'react';
import LayoutBuilder from '@/components/articleBuilder/LayoutBuilder';
import { Button } from '@heroui/button';
import { Card, CardHeader } from '@heroui/card';
import { addToast } from '@heroui/toast';
import { Tooltip } from '@heroui/tooltip';
import { Modal } from '@heroui/modal';

type WindowType = 'editor' | 'preview' | 'ai';

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

const MOBILE_BREAKPOINT = 768; // md breakpoint in Tailwind

export default function ArticleBuilder() {
  const [visibleWindows, setVisibleWindows] = useState<WindowType[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeWindow, setActiveWindow] = useState<WindowType>('editor');
  const [postId, setPostId] = useState<string | null>(null);
  const [postStatus, setPostStatus] = useState<'draft' | 'public' | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load saved windows and post data on mount
  useEffect(() => {
    const windows: WindowType[] = [];
    const editorVisible = localStorage.getItem(STORAGE_KEYS.editor);
    const previewVisible = localStorage.getItem(STORAGE_KEYS.preview);
    const aiVisible = localStorage.getItem(STORAGE_KEYS.ai);
    
    // Only set default windows if none are saved
    if (editorVisible === null && previewVisible === null && aiVisible === null) {
      const defaultWindows: WindowType[] = ['editor', 'preview', 'ai'];
      windows.push(...defaultWindows);
      localStorage.setItem(STORAGE_KEYS.editor, 'true');
      localStorage.setItem(STORAGE_KEYS.preview, 'true');
      localStorage.setItem(STORAGE_KEYS.ai, 'true');
    } else {
      if (editorVisible === 'true') windows.push('editor');
      if (previewVisible === 'true') windows.push('preview');
      if (aiVisible === 'true') windows.push('ai');
    }
    
    setVisibleWindows(windows);
    setActiveWindow(windows[0] as WindowType);

    // Load post data if exists
    const savedPostId = localStorage.getItem(STORAGE_KEYS.postId);
    if (savedPostId) {
      setPostId(savedPostId);
      // Fetch post data
      fetch(`/api/posts/${savedPostId}`)
        .then(res => res.json())
        .then(post => {
          setPostStatus(post.status);
          // Only update localStorage if values are not already set
          if (!localStorage.getItem(STORAGE_KEYS.title)) {
            localStorage.setItem(STORAGE_KEYS.title, post.name || '');
          }
          if (!localStorage.getItem(STORAGE_KEYS.tags)) {
            localStorage.setItem(STORAGE_KEYS.tags, JSON.stringify(post.tags || []));
          }
          if (!localStorage.getItem(STORAGE_KEYS.shortDesc)) {
            localStorage.setItem(STORAGE_KEYS.shortDesc, post.shortDesc || '');
          }
          if (!localStorage.getItem(STORAGE_KEYS.image)) {
            localStorage.setItem(STORAGE_KEYS.image, post.image || '');
          }
          if (!localStorage.getItem(STORAGE_KEYS.content)) {
            localStorage.setItem(STORAGE_KEYS.content, post.content || '');
          }
        })
        .catch(err => {
          console.error('Error fetching post data:', err);
          addToast({
            title: 'Error',
            description: 'Failed to load post data',
            color: 'danger'
          });
        });
    }
    setIsInitialized(true);
  }, []);

  const toggleWindow = (window: WindowType) => {
    if (isMobile) {
      // On mobile, just switch the active window
      setActiveWindow(window);
      // Make sure the window is visible
      if (!visibleWindows.includes(window)) {
        setVisibleWindows(prev => {
          const newWindows = [...prev, window];
          // Save to localStorage
          localStorage.setItem(STORAGE_KEYS.editor, newWindows.includes('editor').toString());
          localStorage.setItem(STORAGE_KEYS.preview, newWindows.includes('preview').toString());
          localStorage.setItem(STORAGE_KEYS.ai, newWindows.includes('ai').toString());
          return newWindows;
        });
      }
    } else {
      // On desktop, toggle window visibility
      setVisibleWindows(prev => {
        const newWindows = prev.includes(window)
          ? prev.filter(w => w !== window)
          : [...prev, window];
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.editor, newWindows.includes('editor').toString());
        localStorage.setItem(STORAGE_KEYS.preview, newWindows.includes('preview').toString());
        localStorage.setItem(STORAGE_KEYS.ai, newWindows.includes('ai').toString());
        
        return newWindows;
      });
    }
  };

  const handleSave = async () => {
    try {
      const postData = {
        name: localStorage.getItem(STORAGE_KEYS.title) || '',
        tags: JSON.parse(localStorage.getItem(STORAGE_KEYS.tags) || '[]'),
        shortDesc: localStorage.getItem(STORAGE_KEYS.shortDesc) || '',
        image: localStorage.getItem(STORAGE_KEYS.image) || '',
        content: localStorage.getItem(STORAGE_KEYS.content) || '',
        status: 'draft'
      };

      if (postId) {
        // Update existing post
        const res = await fetch(`/api/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData)
        });
        if (!res.ok) throw new Error('Failed to update post');
      } else {
        // Create new post
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData)
        });
        if (!res.ok) throw new Error('Failed to create post');
        const { id } = await res.json();
        setPostId(id);
        localStorage.setItem(STORAGE_KEYS.postId, id);
      }

      setPostStatus('draft');
      addToast({
        title: 'Saved',
        description: 'Post saved as draft',
        color: 'success'
      });
    } catch (err) {
      addToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save post',
        color: 'danger'
      });
    }
  };

  const handlePublish = async () => {
    if (!postId) {
      addToast({
        title: 'Error',
        description: 'Please save the post first',
        color: 'danger'
      });
      return;
    }

    try {
      const newStatus = postStatus === 'public' ? 'draft' : 'public';
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update post status');
      
      setPostStatus(newStatus);
      addToast({
        title: newStatus === 'public' ? 'Published' : 'Draft',
        description: `Post is now ${newStatus}`,
        color: 'success'
      });
    } catch (err) {
      addToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update post status',
        color: 'danger'
      });
    }
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex flex-col h-full">
        <Card className="border-0 rounded-none flex-shrink-0">
          <CardHeader className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Article Builder</h1>
            <div className="flex space-x-2">
              <Button variant="ghost" disabled>Editor</Button>
              <Button variant="ghost" disabled>AI Agent</Button>
              <Button variant="ghost" disabled>Preview</Button>
            </div>
          </CardHeader>
        </Card>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Card className="border-0 rounded-none flex-shrink-0">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Article Builder</h1>
            <div className="flex space-x-2">
              <Tooltip 
                content={
                  <div className="text-sm">
                    <div className="font-medium">Editor</div>
                    <div className="text-gray-400">Toggle editor window</div>
                  </div>
                }
                placement="bottom"
              >
                <Button
                  variant={isMobile ? (activeWindow === 'editor' ? 'solid' : 'ghost') : (visibleWindows.includes('editor') ? 'solid' : 'ghost')}
                  onClick={() => toggleWindow('editor')}
                  className="relative group"
                >
                  <span>Editor</span>
                </Button>
              </Tooltip>
              
              <Tooltip 
                content={
                  <div className="text-sm">
                    <div className="font-medium">AI Agent</div>
                    <div className="text-gray-400">Toggle AI assistant</div>
                  </div>
                }
                placement="bottom"
              >
                <Button
                  variant={isMobile ? (activeWindow === 'ai' ? 'solid' : 'ghost') : (visibleWindows.includes('ai') ? 'solid' : 'ghost')}
                  onClick={() => toggleWindow('ai')}
                  className="relative group"
                >
                  <span>AI Agent</span>
                </Button>
              </Tooltip>

              <Tooltip 
                content={
                  <div className="text-sm">
                    <div className="font-medium">Preview</div>
                    <div className="text-gray-400">Toggle preview window</div>
                  </div>
                }
                placement="bottom"
              >
                <Button
                  variant={isMobile ? (activeWindow === 'preview' ? 'solid' : 'ghost') : (visibleWindows.includes('preview') ? 'solid' : 'ghost')}
                  onClick={() => toggleWindow('preview')}
                  className="relative group"
                >
                  <span>Preview</span>
                </Button>
              </Tooltip>
            </div>
          </div>
          <div className="flex space-x-2">
            {postId && (
              <Button
                variant={postStatus === 'public' ? 'ghost' : 'solid'}
                color={postStatus === 'public' ? 'danger' : 'primary'}
                onClick={() => setShowPublishModal(true)}
              >
                {postStatus === 'public' ? 'Unpublish' : 'Publish'}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleSave}
            >
              Save as Draft
            </Button>
          </div>
        </CardHeader>
      </Card>
      <div className="flex-1 min-h-0">
        <LayoutBuilder 
          visibleWindows={isMobile ? [activeWindow] : visibleWindows} 
        />
      </div>

      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title={postStatus === 'public' ? 'Unpublish Post' : 'Publish Post'}
      >
        <div className="p-4">
          <p className="mb-4">
            {postStatus === 'public' 
              ? 'Are you sure you want to unpublish this post? It will no longer be visible to readers.'
              : 'Are you sure you want to publish this post? It will be visible to all readers.'}
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={() => setShowPublishModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color={postStatus === 'public' ? 'danger' : 'primary'}
              onClick={() => {
                handlePublish();
                setShowPublishModal(false);
              }}
            >
              {postStatus === 'public' ? 'Unpublish' : 'Publish'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 