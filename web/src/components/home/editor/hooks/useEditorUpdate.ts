import { RefObject, useCallback, useEffect, useRef } from 'react';
import { EditorEvents } from '@tiptap/core';
import { splitEditorHtml } from '~components/home/editor/helpers/markdown';

const SERIALIZE_DEBOUNCE_MS = 150;

export type UseEditorUpdateProps = {
  onChange: (next: { title: string; body: string }) => void;
  stickyEditor: RefObject<{ title: string; body: string }>;
};
export const useEditorUpdate = ({ onChange, stickyEditor }: UseEditorUpdateProps) => {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the debounced
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Time gate update requests for the title and body of the document being edited.
  // Updates should wait until the user has stopped typing
  return useCallback(
    ({ editor }: EditorEvents['update']) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const next = splitEditorHtml(editor.getHTML());
        stickyEditor.current = next;
        onChange(next);
      }, SERIALIZE_DEBOUNCE_MS);
    },
    [onChange, stickyEditor],
  );
};
