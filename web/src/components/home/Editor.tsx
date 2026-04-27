'use client';

import { useEffect, useRef, useCallback } from 'react';
import { editorStoreSnapshot, useEditorStore } from '~store/useEditorStore';
import { useUpsertDocumentMutation } from '~lib/mutations/story';

export function Editor() {
  const { title, body, fontSize, fontFamily, setTitle, setBody, markSaved } = useEditorStore();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const upsertDocument = useUpsertDocumentMutation();

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
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  return (
    <div
      className="flex-1 flex flex-col w-full h-full bg-background text-foreground transition-colors duration-300 mx-auto max-w-4xl"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled Document"
        className="w-full bg-transparent border-none outline-none px-12 pt-16 pb-2"
        style={{
          fontSize: fontSize * 1.8,
          lineHeight: 1.4,
          fontFamily,
          fontWeight: 700,
        }}
      />

      <textarea
        ref={bodyRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Start writing..."
        className="flex-1 w-full bg-transparent border-none outline-none resize-none px-12 py-4"
        style={{
          fontSize,
          lineHeight: 1.8,
          fontFamily,
        }}
      />
    </div>
  );
}
