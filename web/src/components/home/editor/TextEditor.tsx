'use client';
import { useEditor, EditorContent, Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef } from 'react';
import { cn } from '~utils/merge-css-classes';
import { buildEditorHtml } from './helpers/markdown';
import { Title, TitleDocument } from './extensions/Title';
import { Entity } from '~components/home/editor/extensions/Entity';
import { Candidate } from '~components/home/editor/extensions/Candidate';
import { Paragraph } from '~components/home/editor/extensions/Paragraph';
import { RejectedEntity } from '~components/home/editor/extensions/RejectedEntity';
import { useEditorPlaceholder } from '~components/home/editor/hooks/useEditorPlaceholder';
import { useEditorFadeEffect } from '~components/home/editor/hooks/useEditorFadeEffect';
import { useEditorUpdate } from '~components/home/editor/hooks/useEditorUpdate';

// Editor CSS
const editorProps = {
  attributes: {
    class: 'tiptap-body flex-1 w-full min-h-0 outline-none px-12 pt-0 pb-4 overflow-y-auto',
  },
};
// Editor Default Markup Extensions
const starterKit = StarterKit.configure({ link: false, document: false, paragraph: false });
// Editor Extensions
const linkExtension = Link.configure({
  openOnClick: false,
  autolink: true,
  HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
});
const taskItem = TaskItem.configure({ nested: true });

interface TextEditorProps {
  title: string;
  body: string;
  onChange: (next: { title: string; body: string }) => void;
  setEditor: Setter<TiptapEditor | null>;
  fontSize: number;
  fontFamily: string;
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
}
export const TextEditor = ({
  title,
  body,
  onChange,
  setEditor,
  fontSize,
  fontFamily,
  titlePlaceholder = 'Untitled Document',
  bodyPlaceholder = 'Start writing...',
}: TextEditorProps) => {
  // Stores previous render of title and body of document being edited.
  const stickyDocument = useRef<{ title: string; body: string }>({ title, body });

  const onUpdate = useEditorUpdate({ onChange, stickyDocument });
  const placeholder = useEditorPlaceholder({ bodyPlaceholder, titlePlaceholder });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      starterKit,
      Paragraph,
      Candidate,
      Entity,
      TitleDocument,
      Title,
      linkExtension,
      TaskList,
      taskItem,
      Placeholder.configure({ placeholder }),
      RejectedEntity,
    ],
    content: buildEditorHtml(title, body),
    editorProps,
    onUpdate,
  });

  // Pass and revoke a reference to the tiptap editor and store it as state for the editor component.
  useEffect(() => {
    setEditor(editor);
    return () => setEditor(null);
  }, [editor, setEditor]);

  // Update the editor content when the title or body changes.
  useEffect(() => {
    if (!editor) return;
    const last = stickyDocument.current;
    // If the editor content is the same as the last emitted content, don't update the editor.'
    if (title === last.title && body === last.body) return;
    editor.commands.setContent(buildEditorHtml(title, body), { emitUpdate: false });
    stickyDocument.current = { title, body };
  }, [title, body, editor]);

  const isAtBottom = useEditorFadeEffect(editor);

  return (
    <div
      className={cn(
        '-rich-editor- relative flex-1 flex flex-col min-h-0 bg-background',
        'tiptap-host',
      )}
      style={{ fontSize, fontFamily, lineHeight: 'var(--lh)' }}
    >
      <EditorContent editor={editor} className='editor-content flex-1 flex flex-col min-h-0' />
      {!isAtBottom && (
        <div
          className='absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10'
          style={{ background: 'linear-gradient(to top, var(--background), transparent)' }}
        />
      )}
    </div>
  );
};
