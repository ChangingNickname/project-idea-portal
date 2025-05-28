'use client';

import { useState, useEffect } from 'react';
import Editor from './Editor';
import Preview from './Preview';
import AIAgent from './AIAgent';
import { Card } from '@heroui/card';

type WindowType = 'editor' | 'preview' | 'ai';

interface LayoutBuilderProps {
  visibleWindows: WindowType[];
}

const STORAGE_KEYS = {
  editor: 'article-builder-editor-visible',
  preview: 'article-builder-preview-visible',
  ai: 'article-builder-ai-visible'
};

// Define the default order of windows
const DEFAULT_ORDER: WindowType[] = ['editor', 'ai', 'preview'];

export default function LayoutBuilder({ visibleWindows }: LayoutBuilderProps) {
  const [savedWindows, setSavedWindows] = useState<WindowType[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved windows on mount
  useEffect(() => {
    const windows: WindowType[] = [];
    // Check if any window was previously shown
    const hasAnyWindow = Object.values(STORAGE_KEYS).some(key => 
      localStorage.getItem(key) === 'true'
    );
    
    // If no windows were shown before, keep empty array
    if (hasAnyWindow) {
      // Use DEFAULT_ORDER to maintain consistent window order
      DEFAULT_ORDER.forEach(window => {
        if (localStorage.getItem(STORAGE_KEYS[window]) === 'true') {
          windows.push(window);
        }
      });
    }
    
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

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // If no windows are visible, show a message
  if (savedWindows.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg">Select a window to start working</p>
          <p className="text-sm mt-2">Use the buttons above to show Editor, Preview, or AI Agent</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div 
        className="grid h-full" 
        style={{
          gridTemplateColumns: `repeat(${savedWindows.length}, 1fr)`,
          gap: '1px',
          backgroundColor: '#e5e7eb'
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