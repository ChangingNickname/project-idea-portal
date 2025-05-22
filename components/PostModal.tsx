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
        <ModalHeader>Редактор</ModalHeader>
        <ModalBody>
          <div className="h-[60vh] overflow-auto">
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
            Отмена
          </Button>
          <Button
            color="primary"
            onPress={() => {
              localStorage.setItem(STORAGE_KEY, content);
              onClose();
            }}
          >
            Сохранить
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 