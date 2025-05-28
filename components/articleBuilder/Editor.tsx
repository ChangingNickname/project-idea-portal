'use client';

import React, { useState, useEffect } from 'react';
import {
  MDXEditor,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  ListsToggle,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  InsertImage,
  InsertThematicBreak,
  InsertCodeBlock,
  DiffSourceToggleWrapper,
  frontmatterPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  diffSourcePlugin
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { PREVIEW_UPDATE_EVENT } from './Preview';

const STORAGE_KEYS = {
  title: 'article-builder-title',
  tags: 'article-builder-tags',
  shortDesc: 'article-builder-short-desc',
  image: 'article-builder-image',
  content: 'article-builder-content'
};

type Section = 'title' | 'tags' | 'shortDesc' | 'image' | 'content';

export default function Editor() {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [image, setImage] = useState('');
  const [content, setContent] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState<Section | null>(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load saved content on mount
  useEffect(() => {
    setTitle(localStorage.getItem(STORAGE_KEYS.title) || '');
    setTags(localStorage.getItem(STORAGE_KEYS.tags) || '');
    setShortDesc(localStorage.getItem(STORAGE_KEYS.shortDesc) || '');
    setImage(localStorage.getItem(STORAGE_KEYS.image) || '');
    setContent(localStorage.getItem(STORAGE_KEYS.content) || '');
    setIsInitialized(true);
  }, []);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.storageArea === localStorage) {
        // Update editor content when localStorage changes
        setTitle(localStorage.getItem(STORAGE_KEYS.title) || '');
        setTags(localStorage.getItem(STORAGE_KEYS.tags) || '');
        setShortDesc(localStorage.getItem(STORAGE_KEYS.shortDesc) || '');
        setImage(localStorage.getItem(STORAGE_KEYS.image) || '');
        setContent(localStorage.getItem(STORAGE_KEYS.content) || '');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateStorage = (key: string, value: string) => {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event(PREVIEW_UPDATE_EVENT));
  };

  // Save content changes
  useEffect(() => {
    updateStorage(STORAGE_KEYS.title, title);
  }, [title]);

  useEffect(() => {
    updateStorage(STORAGE_KEYS.tags, tags);
  }, [tags]);

  useEffect(() => {
    updateStorage(STORAGE_KEYS.shortDesc, shortDesc);
  }, [shortDesc]);

  useEffect(() => {
    updateStorage(STORAGE_KEYS.image, image);
  }, [image]);

  useEffect(() => {
    updateStorage(STORAGE_KEYS.content, content);
  }, [content]);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast({
        title: "Error",
        description: "Please upload an image file",
        color: "danger"
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const editorPlugins = [
    toolbarPlugin({
      toolbarContents: () => (
        <div className="flex flex-wrap gap-2 p-2">
          <div className="flex flex-wrap gap-2">
            <UndoRedo />
            <BoldItalicUnderlineToggles />
            <ListsToggle />
          </div>
          <div className="flex flex-wrap gap-2">
            <BlockTypeSelect />
            <CreateLink />
            <InsertTable />
          </div>
          <div className="flex flex-wrap gap-2">
            <InsertImage />
            <InsertThematicBreak />
            <InsertCodeBlock />
          </div>
          <div className="flex flex-wrap gap-2">
            <DiffSourceToggleWrapper>
              <></>
            </DiffSourceToggleWrapper>
          </div>
        </div>
      )
    }),
    headingsPlugin(),
    listsPlugin(),
    quotePlugin(),
    thematicBreakPlugin(),
    markdownShortcutPlugin(),
    linkPlugin(),
    linkDialogPlugin(),
    imagePlugin(),
    tablePlugin(),
    codeBlockPlugin(),
    codeMirrorPlugin(),
    frontmatterPlugin(),
    diffSourcePlugin()
  ];

  if (!isInitialized) {
    return (
      <Card className="h-full">
        <CardBody className="flex items-center justify-center">
          <p className="text-gray-500">Loading editor...</p>
        </CardBody>
      </Card>
    );
  }

  const sections: { id: Section; title: string }[] = [
    { id: 'title', title: 'Title' },
    { id: 'tags', title: 'Tags' },
    { id: 'shortDesc', title: 'Short Description' },
    { id: 'image', title: 'Featured Image' },
    { id: 'content', title: 'Full Content' }
  ];

  const renderSection = (section: Section) => {
    switch (section) {
      case 'title':
        return (
          <div className="p-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title"
              className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        );
      case 'tags':
        return (
          <div className="p-4">
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags (comma separated)"
              className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        );
      case 'shortDesc':
        return (
          <div className="p-4">
            <MDXEditor
              markdown={shortDesc}
              onChange={setShortDesc}
              contentEditableClassName={`prose max-w-none min-h-[100px] text-gray-900 dark:text-gray-100 ${isMobile ? 'text-sm' : 'text-base'} p-4`}
              plugins={editorPlugins}
              className="h-full [&_.mdxeditor-toolbar]:flex-wrap [&_.mdxeditor-toolbar]:gap-2 [&_.mdxeditor-toolbar]:p-2 [&_.mdxeditor-toolbar]:sticky [&_.mdxeditor-toolbar]:top-0 [&_.mdxeditor-toolbar]:bg-white [&_.mdxeditor-toolbar]:dark:bg-gray-800 [&_.mdxeditor-toolbar]:z-1 [&_.mdxeditor-toolbar]:border-b [&_.mdxeditor-toolbar_button]:text-gray-700 [&_.mdxeditor-toolbar_button]:dark:text-gray-200 [&_.mdxeditor-toolbar_button]:bg-gray-100 [&_.mdxeditor-toolbar_button]:dark:bg-gray-700 [&_.mdxeditor-toolbar_button]:hover:bg-gray-200 [&_.mdxeditor-toolbar_button]:dark:hover:bg-gray-600 [&_.mdxeditor-toolbar_button]:active:bg-gray-300 [&_.mdxeditor-toolbar_button]:dark:active:bg-gray-500"
            />
          </div>
        );
      case 'image':
        return (
          <div className="p-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer block"
              >
                {image ? (
                  <div className="mt-2">
                    <img src={image} alt="Preview" className="max-h-40 rounded mx-auto" />
                    <p className="mt-2 text-sm">Click to change image</p>
                  </div>
                ) : (
                  <div>
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-1 text-sm">Click to upload an image</p>
                    <p className="mt-1 text-xs">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        );
      case 'content':
        return (
          <div className="p-4">
            <MDXEditor
              markdown={content}
              onChange={setContent}
              contentEditableClassName={`prose max-w-none min-h-[100px] text-gray-900 dark:text-gray-100 ${isMobile ? 'text-sm' : 'text-base'} p-4`}
              plugins={editorPlugins}
              className="h-full [&_.mdxeditor-toolbar]:flex-wrap [&_.mdxeditor-toolbar]:gap-2 [&_.mdxeditor-toolbar]:p-2 [&_.mdxeditor-toolbar]:sticky [&_.mdxeditor-toolbar]:top-0 [&_.mdxeditor-toolbar]:bg-white [&_.mdxeditor-toolbar]:dark:bg-gray-800 [&_.mdxeditor-toolbar]:z-1 [&_.mdxeditor-toolbar]:border-b [&_.mdxeditor-toolbar_button]:text-gray-700 [&_.mdxeditor-toolbar_button]:dark:text-gray-200 [&_.mdxeditor-toolbar_button]:bg-gray-100 [&_.mdxeditor-toolbar_button]:dark:bg-gray-700 [&_.mdxeditor-toolbar_button]:hover:bg-gray-200 [&_.mdxeditor-toolbar_button]:dark:hover:bg-gray-600 [&_.mdxeditor-toolbar_button]:active:bg-gray-300 [&_.mdxeditor-toolbar_button]:dark:active:bg-gray-500"
            />
          </div>
        );
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 border-b">
        <h2 className="text-lg font-semibold">Article Editor</h2>
      </CardHeader>
      <CardBody className="flex-1 overflow-auto p-0">
        <div className="h-full flex flex-col">
          {/* Section buttons */}
          <div className="flex flex-wrap gap-2 p-4 border-b">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? 'solid' : 'ghost'}
                onClick={() => setActiveSection(section.id)}
                className="flex-shrink-0"
              >
                {section.title}
              </Button>
            ))}
          </div>

          {/* Active section content */}
          {activeSection && (
            <div className="flex-1 overflow-auto">
              {renderSection(activeSection)}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
} 