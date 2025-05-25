import { useState } from 'react';
import { Button } from '@heroui/button';
import { MDXEditor } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

interface InputFormProps {
  onSubmit: (content: string) => void;
  isLoading?: boolean;
}

export function InputForm({ onSubmit, isLoading = false }: InputFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isLoading) {
      onSubmit(content);
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-white">
      <div className="flex gap-2">
        <div className="flex-1">
          <MDXEditor
            markdown={content}
            onChange={setContent}
            className="!border !rounded-lg"
          />
        </div>
        <Button
          type="submit"
          color="primary"
          isLoading={isLoading}
          isDisabled={!content.trim() || isLoading}
        >
          Send
        </Button>
      </div>
    </form>
  );
} 