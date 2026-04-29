'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import type { Editor as TiptapEditor } from '@tiptap/react';
import { editorStoreSnapshot, useEditorStore } from '~store/useEditorStore';
import { useUpsertDocumentMutation } from '~lib/mutations/story';
import { cn } from '~utils/merge-css-classes';
import { EditorToolbar } from '~components/home/editor/EditorToolbar';
import { RichEditor } from '~components/home/editor/RichEditor';
import { EditorWordCount } from '~components/home/editor/EditorWordCount';

export function Editor() {
  const { title, body, fontSize, fontFamily, setTitle, setBody, markSaved } = useEditorStore();
  const [editor, setEditor] = useState<TiptapEditor | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const upsertDocument = useUpsertDocumentMutation();

  const wordCount = useMemo(() => {
    const trimmed = body.trim();
    return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  }, [body]);

  const charCount = body.length;

  const handleSave = useCallback(async () => {
    const snapshot = editorStoreSnapshot();
    if (!snapshot.isDirty || !snapshot.documentId) return;
    try {
      await upsertDocument.mutateAsync({
        documentId: snapshot.documentId,
        storyId: snapshot.storyId ?? undefined,
        title: snapshot.title,
        body: snapshot.body,
      });
      markSaved();
    } catch (e) {
      console.error('Auto-save failed:', e);
    }
  }, [upsertDocument, markSaved]);

  useEffect(() => {
    intervalRef.current = setInterval(handleSave, 5 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [handleSave]);

  useEffect(() => {
    if (!editor) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'k') {
        if (!editor.isFocused) return;
        e.preventDefault();
        const previous = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Link URL', previous ?? 'https://');
        if (url === null) return;
        if (url === '') {
          editor.chain().focus().extendMarkRange('link').unsetLink().run();
          return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editor]);

  const handleChange = useCallback(
    (next: { title: string; body: string }) => {
      setTitle(next.title);
      setBody(next.body);
    },
    [setTitle, setBody],
  );

  return (
    <div className='-editor- h-100vh w-full max-w-[65ch] mx-auto'>
      <div
        className={cn(
          'flex-1 flex flex-col',
          'w-full h-[calc(100vh-2rem)]',
          'mt-2 border-2 border-border rounded-lg',
          'bg-temp shadow-background shadow-2xl',
          'text-foreground overflow-hidden',
        )}
      >
        <EditorToolbar editor={editor} />
        <RichEditor
          title={title}
          body={body}
          onChange={handleChange}
          onEditorReady={setEditor}
          onSave={handleSave}
          fontSize={fontSize}
          fontFamily={fontFamily}
        />
      </div>
      <EditorWordCount charCount={charCount} wordCount={wordCount} />
    </div>
  );
}
