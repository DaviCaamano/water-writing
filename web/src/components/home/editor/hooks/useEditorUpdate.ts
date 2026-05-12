import { RefObject, useCallback, useEffect, useRef } from 'react';
import { EditorEvents } from '@tiptap/core';
import { splitEditorHtml } from '~components/home/editor/helpers/markdown';

const SERIALIZE_DEBOUNCE_MS = 150;

export type UseEditorUpdateProps = {
  onChange: (next: { title: string; body: string }) => void;
  stickyDocument: RefObject<{ title: string; body: string }>;
};
export const useEditorUpdate = ({ onChange, stickyDocument }: UseEditorUpdateProps) => {
  // Time gate update requests for the title and body of the document being edited.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the debounced
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return useCallback(
    ({ editor }: EditorEvents['update']) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const next = splitEditorHtml(editor.getHTML());
        stickyDocument.current = next;
        onChange(next);
      }, SERIALIZE_DEBOUNCE_MS);
    },
    [onChange, stickyDocument],
  );
};
