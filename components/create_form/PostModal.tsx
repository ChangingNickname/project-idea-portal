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

const STORAGE_KEY = 'post_editor_content';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedContent = localStorage.getItem(STORAGE_KEY);
      if (savedContent) setContent(savedContent);
    }
  }, [isOpen]);

  useEffect(() => {
    if (content) localStorage.setItem(STORAGE_KEY, content);
  }, [content]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl">
      <ModalContent>
        <ModalHeader>Post a Project Idea</ModalHeader>
        <ModalBody>
          <div className="h-[60vh] overflow-auto">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="project-name">
                Project Name
              </label>
              <input
                id="project-name"
                type="text"
                className="w-full border rounded px-3 py-2"
                value={content.split('\n')[0] || ''}
                onChange={e => {
                  const lines = content.split('\n');
                  lines[0] = e.target.value;
                  setContent(lines.join('\n'));
                }}
                placeholder="Enter project name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="project-tags">
                Tags (comma separated)
              </label>
              <input
                id="project-tags"
                type="text"
                className="w-full border rounded px-3 py-2"
                value={
                  content.match(/^tags:\s*(.*)$/m)?.[1] || ''
                }
                onChange={e => {
                  let newContent = content;
                  if (/^tags:/m.test(content)) {
                    newContent = content.replace(/^tags:.*$/m, `tags: ${e.target.value}`);
                  } else {
                    newContent = `tags: ${e.target.value}\n` + content;
                  }
                  setContent(newContent);
                }}
                placeholder="e.g. AI, Web, React"
              />
            </div>
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
                      <DiffSourceToggleWrapper />
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
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Canecl
          </Button>
          <Button
            color="primary"
            onPress={() => {
              localStorage.setItem(STORAGE_KEY, content);
              onClose();
            }}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 