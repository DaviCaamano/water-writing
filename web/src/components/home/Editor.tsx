'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '~store/useEditorStore';

export function Editor() {
  const { title, body, fontSize, fontFamily, theme, setTitle, setBody, saveDocument, isDirty } =
    useEditorStore();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    try {
      await saveDocument();
    } catch (e) {
      console.error('Auto-save failed:', e);
    }
  }, [isDirty, saveDocument]);

  // Auto-save every 5 minutes
  useEffect(() => {
    intervalRef.current = setInterval(handleSave, 5 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [handleSave]);

  // Handle Ctrl+S manual save
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  const themeClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-gray-100',
    sepia: 'bg-amber-50 text-amber-950',
  };

  return (
    <div
      className={`flex-1 flex flex-col w-full h-full ${themeClasses[theme]} transition-colors duration-300 mx-auto max-w-4xl`}
    >
      {/* Title */}
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

      {/* Body */}
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
