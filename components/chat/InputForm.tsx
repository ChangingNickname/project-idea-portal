import { useState, useRef } from 'react';
import { Button } from '@heroui/button';
import { MDXEditor } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

interface InputFormProps {
  onSubmit: (content: string) => void;
  isLoading?: boolean;
}

export function InputForm({ onSubmit, isLoading = false }: InputFormProps) {
  const [content, setContent] = useState('');
  const editorRef = useRef<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isLoading) {
      onSubmit(content);
      setContent('');
      // Очищаем редактор, если есть ref
      if (editorRef.current && typeof editorRef.current.setMarkdown === 'function') {
        editorRef.current.setMarkdown('');
      }
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="border-t p-4 bg-background dark:bg-background">
        <div className="flex gap-2">
          <div className="flex-1">
            <MDXEditor
              ref={editorRef}
              markdown={content}
              onChange={setContent}
              className="!border !rounded-lg !bg-content1 dark:!bg-content1 min-h-[48px]"
              contentEditableClassName="prose max-w-none min-h-[32px] text-gray-900 dark:text-gray-100"
            />
          </div>
          <Button
            type="submit"
            color="primary"
            isLoading={isLoading}
            isDisabled={!content.trim() || isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary-600"
          >
            Send
          </Button>
        </div>
      </form>
      <style jsx global>{`
        /* Скрывать mdxeditor-popup-container только внутри InputForm, если он пустой */
        .mdxeditor-popup-container:empty {
          display: none !important;
        }
        /* Если нужно полностью убрать любые popup-элементы редактора только в InputForm */
        .mdxeditor-popup-container {
          pointer-events: none;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
} 