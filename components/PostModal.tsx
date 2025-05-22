'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Input } from "@heroui/input";
import { Post, CreatePostData } from '@/types/post';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: Post) => void;
}

const STORAGE_KEY = 'post_editor_content';
const TAGS_KEY = 'post_editor_tags';
const TITLE_KEY = 'post_editor_title';

export const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      const savedContent = localStorage.getItem(STORAGE_KEY);
      if (savedContent) setContent(savedContent);
      const savedTags = localStorage.getItem(TAGS_KEY);
      if (savedTags) setTags(JSON.parse(savedTags));
      const savedTitle = localStorage.getItem(TITLE_KEY);
      if (savedTitle) setTitle(savedTitle);
    }
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, content);
  }, [content]);
  useEffect(() => {
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
  }, [tags]);
  useEffect(() => {
    localStorage.setItem(TITLE_KEY, title);
  }, [title]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const postData: CreatePostData = {
        title,
        content,
        tags: tags.filter(tag => tag.trim() !== ''),
      };
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create post');
      }
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TAGS_KEY);
      localStorage.removeItem(TITLE_KEY);
      setTitle('');
      setContent('');
      setTags([]);
      onPostCreated?.(data.data);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl">
      <ModalContent>
        <ModalHeader>Create Post</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project Name</label>
              <Input
                ref={inputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter project name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <Input
                value={tags.join(', ')}
                onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()))}
                placeholder="Enter tags separated by commas"
                className="w-full"
              />
            </div>
            <div className="h-[40vh] overflow-auto">
              <MDXEditor
                markdown={content}
                onChange={setContent}
                contentEditableClassName="prose max-w-none"
                plugins={[
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
                ]}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!title || !content || tags.length === 0}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 