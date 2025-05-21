'use client'

import type { ForwardedRef } from 'react'
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  diffSourcePlugin,
  toolbarPlugin,
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  DiffSourceToggleWrapper,
  UndoRedo
} from '@mdxeditor/editor'

export default function InitializedMDXEditor({
  editorRef,
  diffMarkdown,
  ...props
}: { 
  editorRef: ForwardedRef<MDXEditorMethods> | null
  diffMarkdown?: string 
} & MDXEditorProps) {
  return (
    <MDXEditor
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        diffSourcePlugin({ 
          diffMarkdown: diffMarkdown || '',
          viewMode: 'rich-text'
        }),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <UndoRedo />
            </DiffSourceToggleWrapper>
          )
        })
      ]}
      {...props}
      ref={editorRef}
    />
  )
} 