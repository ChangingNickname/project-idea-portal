'use client'

import { useRef, useState } from 'react'
import { ForwardRefEditor } from '@/components/editor/ForwardRefEditor'
import type { MDXEditorMethods } from '@mdxeditor/editor'

export default function TestEditorPage() {
  const editorRef = useRef<MDXEditorMethods>(null)
  const [currentMarkdown, setCurrentMarkdown] = useState('# Hello World\n\nThis is a test of the MDX editor.')
  const [diffMarkdown, setDiffMarkdown] = useState('# Hello World\n\nThis is the original version of the document.')

  const handleSave = () => {
    const markdown = editorRef.current?.getMarkdown()
    console.log('Current markdown:', markdown)
    setCurrentMarkdown(markdown || '')
  }

  const handleUpdateDiff = () => {
    const markdown = editorRef.current?.getMarkdown()
    setDiffMarkdown(markdown || '')
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">MDX Editor Test</h1>
      
      <div className="border rounded-lg p-4 mb-4">
        <ForwardRefEditor
          ref={editorRef}
          markdown={currentMarkdown}
          diffMarkdown={diffMarkdown}
          onChange={setCurrentMarkdown}
        />
      </div>

      <div className="space-x-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save
        </button>
        <button
          onClick={handleUpdateDiff}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Update Diff Version
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Current Content:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {currentMarkdown}
        </pre>
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">Diff Version:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {diffMarkdown}
        </pre>
      </div>
    </div>
  )
} 