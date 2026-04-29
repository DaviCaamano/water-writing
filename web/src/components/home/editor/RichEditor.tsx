'use client';

import { useEditor, EditorContent, Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef } from 'react';
import { cn } from '~utils/merge-css-classes';
import { buildEditorHtml, splitEditorHtml } from './markdown';
import { Title, TitleDocument } from './extensions/Title';

interface RichEditorProps {
  title: string;
  body: string;
  onChange: (next: { title: string; body: string }) => void;
  onEditorReady: (editor: TiptapEditor | null) => void;
  onSave?: () => void;
  fontSize: number;
  fontFamily: string;
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
}

const SERIALIZE_DEBOUNCE_MS = 150;

export function RichEditor({
  title,
  body,
  onChange,
  onEditorReady,
  onSave,
  fontSize,
  fontFamily,
  titlePlaceholder = 'Untitled Document',
  bodyPlaceholder = 'Start writing...',
}: RichEditorProps) {
  const lastEmittedRef = useRef<{ title: string; body: string }>({ title, body });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false,
        document: false,
      }),
      TitleDocument,
      Title,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'title' ? titlePlaceholder : bodyPlaceholder,
      }),
    ],
    content: buildEditorHtml(title, body),
    editorProps: {
      attributes: {
        class: 'tiptap-body flex-1 w-full outline-none px-12 pt-0 pb-4 overflow-auto',
      },
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
          event.preventDefault();
          onSaveRef.current?.();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const next = splitEditorHtml(editor.getHTML());
        lastEmittedRef.current = next;
        onChange(next);
      }, SERIALIZE_DEBOUNCE_MS);
    },
  });

  useEffect(() => {
    onEditorReady(editor);
    return () => onEditorReady(null);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) return;
    const last = lastEmittedRef.current;
    if (title === last.title && body === last.body) return;
    editor.commands.setContent(buildEditorHtml(title, body), { emitUpdate: false });
    lastEmittedRef.current = { title, body };
  }, [title, body, editor]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div
      className={cn('-rich-editor- flex-1 flex flex-col overflow-hidden', 'tiptap-host')}
      style={{ fontSize, lineHeight: 1.8, fontFamily }}
    >
      <EditorContent editor={editor} className='flex-1 flex flex-col overflow-hidden' />
    </div>
  );
}
