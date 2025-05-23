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
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import type { Post } from '@/types/posts';
import { isPost } from '@/types/posts';

const STORAGE_KEY = 'post_editor_content';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [image, setImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const savedContent = localStorage.getItem(STORAGE_KEY);
      if (savedContent) setFullDesc(savedContent);
    }
  }, [isOpen]);

  useEffect(() => {
    if (fullDesc) localStorage.setItem(STORAGE_KEY, fullDesc);
  }, [fullDesc]);

  const validateFields = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Title is required';
    }
    if (!shortDesc.trim()) {
      newErrors.shortDesc = 'Short description is required';
    }
    if (!fullDesc.trim()) {
      newErrors.fullDesc = 'Full description is required';
    }
    if (!image) {
      newErrors.image = 'Image is required';
    }
    if (tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      setErrors(prev => ({ ...prev, image: '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleTagsChange = (value: string) => {
    const newTags = value.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    setTags(newTags);
    setErrors(prev => ({ ...prev, tags: '' }));
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      addToast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        color: "danger"
      });
      return;
    }

    try {
      setIsLoading(true);
      const post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        shortDesc: shortDesc.trim(),
        fullDesc: fullDesc.trim(),
        tags,
        image
      };

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      addToast({
        title: "Success",
        description: "Post created successfully",
        color: "success"
      });

      // Clear form
      setName('');
      setShortDesc('');
      setFullDesc('');
      setTags([]);
      setImage('');
      setErrors({});
      localStorage.removeItem(STORAGE_KEY);
      onClose();
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to create post",
        color: "danger"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const editorPlugins = [
    toolbarPlugin({
      toolbarContents: () => (
        <>
          <UndoRedo />
          <BoldItalicUnderlineToggles />
          <CodeToggle />
          <ListsToggle />
          <BlockTypeSelect />
          <CreateLink />
          <InsertTable />
          <InsertImage />
          <InsertThematicBreak />
          <InsertCodeBlock />
          <DiffSourceToggleWrapper>
            <></>
          </DiffSourceToggleWrapper>
        </>
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

  const handleModalClick = (e: React.MouseEvent) => {
    // Prevent clicks inside the modal from closing it
    e.stopPropagation();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="5xl"
      classNames={{
        base: "z-[1000]",
        wrapper: "z-[1000]",
        backdrop: "z-[999]",
        closeButton: "z-[1001]",
        body: "max-h-[90vh] overflow-y-auto"
      }}
    >
      <div onClick={handleModalClick} className="relative">
        <ModalContent>
          <ModalHeader className="sticky top-0 bg-white z-[1002] border-b">
            Create New Post
          </ModalHeader>
          <ModalBody className="overflow-y-auto">
            <div className="space-y-6 pb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Post Title</label>
                <input
                  type="text"
                  placeholder="Enter post title"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  Short Description
                  <span className="text-gray-500 text-xs ml-2">(Brief summary of your post)</span>
                </label>
                <div className={`border rounded ${errors.shortDesc ? 'border-red-500' : ''}`}>
                  <MDXEditor
                    markdown={shortDesc}
                    onChange={(value) => {
                      setShortDesc(value);
                      setErrors(prev => ({ ...prev, shortDesc: '' }));
                    }}
                    contentEditableClassName="prose max-w-none min-h-[100px]"
                    plugins={editorPlugins}
                    className="z-[1003]"
                  />
                </div>
                {errors.shortDesc && <p className="text-red-500 text-sm mt-1">{errors.shortDesc}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Tags
                  <span className="text-gray-500 text-xs ml-2">(Separate tags with commas)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. technology, programming, web"
                  onChange={(e) => handleTagsChange(e.target.value)}
                  className={`w-full p-2 border rounded ${errors.tags ? 'border-red-500' : ''}`}
                />
                {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Featured Image
                  <span className="text-gray-500 text-xs ml-2">(Upload a cover image for your post)</span>
                </label>
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
                    className={`cursor-pointer block ${errors.image ? 'text-red-500' : 'text-gray-600'}`}
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
                {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-2">
                  Full Description
                  <span className="text-gray-500 text-xs ml-2">(Main content of your post)</span>
                </label>
                <div className={`h-[60vh] overflow-auto border rounded ${errors.fullDesc ? 'border-red-500' : ''}`}>
                  <MDXEditor
                    markdown={fullDesc}
                    onChange={(value) => {
                      setFullDesc(value);
                      setErrors(prev => ({ ...prev, fullDesc: '' }));
                    }}
                    contentEditableClassName="prose max-w-none"
                    plugins={editorPlugins}
                    className="z-[1003]"
                  />
                </div>
                {errors.fullDesc && <p className="text-red-500 text-sm mt-1">{errors.fullDesc}</p>}
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="sticky bottom-0 bg-white z-[1002] border-t">
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isLoading}
            >
              Create Post
            </Button>
          </ModalFooter>
        </ModalContent>
      </div>
    </Modal>
  );
}; 