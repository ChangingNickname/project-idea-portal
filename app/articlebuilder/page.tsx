'use client';

import { useState, useEffect } from 'react';
import LayoutBuilder from '@/components/articleBuilder/LayoutBuilder';
import { Button } from '@heroui/button';
import { Card, CardHeader } from '@heroui/card';
import { Tooltip } from '@heroui/tooltip';

type WindowType = 'editor' | 'preview' | 'ai';

const STORAGE_KEYS = {
  editor: 'article-builder-editor-visible',
  preview: 'article-builder-preview-visible',
  ai: 'article-builder-ai-visible'
};

const MOBILE_BREAKPOINT = 768; // md breakpoint in Tailwind

export default function ArticleBuilder() {
  const [visibleWindows, setVisibleWindows] = useState<WindowType[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeWindow, setActiveWindow] = useState<WindowType>('editor');

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load saved windows on mount
  useEffect(() => {
    const windows: WindowType[] = [];
    if (localStorage.getItem(STORAGE_KEYS.editor) === 'true') windows.push('editor');
    if (localStorage.getItem(STORAGE_KEYS.preview) === 'true') windows.push('preview');
    if (localStorage.getItem(STORAGE_KEYS.ai) === 'true') windows.push('ai');
    
    // If no windows were saved, show all by default
    const initialWindows = windows.length > 0 ? windows : ['editor', 'preview', 'ai'] as WindowType[];
    setVisibleWindows(initialWindows);
    setActiveWindow(initialWindows[0] as WindowType);
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
        <CardHeader className="flex items-center space-x-4">
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
        </CardHeader>
      </Card>
      <div className="flex-1 min-h-0">
        <LayoutBuilder 
          visibleWindows={isMobile ? [activeWindow] : visibleWindows} 
        />
      </div>
    </div>
  );
} 