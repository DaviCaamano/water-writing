'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Editor as TiptapEditor } from '@tiptap/react';
import { useEditorStore } from '~store/useEditorStore';
import { useNavigationStore } from '~store/useNavigationStore';
import { cn } from '~utils/merge-css-classes';
import { EditorToolbar } from '~components/home/editor/EditorToolbar';
import { TextEditor } from '~components/home/editor/TextEditor';
import { EditorWordCount } from '~components/home/editor/EditorWordCount';
import { normalizeEditorBody } from '~components/home/editor/helpers/markdown';
import { useEditorQuery } from '~components/home/editor/hooks/useEditorQuery';
import { DocumentResponse } from '#types/shared/response';
import { useEditorSave } from '~components/home/editor/hooks/useEditorSave';
import { KeyDownModifier, useKeyDown } from '~hooks/useKeyDown';
import { useEditorKeyHandler } from '~components/home/editor/hooks/useEditorKeyHandler';

export const Editor = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [editor, setEditor] = useState<TiptapEditor | null>(null);

  const { fontSize, fontFamily, markDirty, markSaved } = useEditorStore();
  const { currentDocumentId, currentStoryId } = useNavigationStore();

  useEditorQuery(currentDocumentId, (documentData: DocumentResponse) => {
    setTitle(documentData.title);
    setBody(documentData.body);
  });

  // Handle (Ctrl|Meta)+S Shortcut for saving the document
  const handleSave = useEditorSave({
    currentStoryId,
    currentDocumentId,
    body,
    markSaved,
    title,
  });

  // Handle (Ctrl|Meta)+K Shortcut for adding a Link to the document
  const { handleLink } = useEditorKeyHandler(editor);

  useKeyDown(
    useMemo(
      () => [
        {
          key: 'k',
          modifiers: [[KeyDownModifier.ctrl], [KeyDownModifier.meta]],
          preventDefault: true,
          handler: handleLink,
        },
        {
          key: 's',
          modifiers: [[KeyDownModifier.ctrl], [KeyDownModifier.meta]],
          preventDefault: true,
          handler: handleSave,
        },
      ],
      [handleLink, handleSave],
    ),
  );

  const handleChange = useCallback(
    (next: { title: string; body: string }) => {
      setTitle(next.title);
      setBody(normalizeEditorBody(next.body));
      markDirty();
    },
    [markDirty],
  );

  return (
    <div className='-editor- h-100vh w-full max-w-[calc(65ch+6rem)] mx-auto bg-transparent'>
      <div
        className={cn(
          'flex-1 flex flex-col',
          'w-full h-[calc(100vh-2rem)]',
          'mt-2.5 border-2 border-border rounded-lg',
          'shadow-background shadow-2xl bg-background',
          'text-foreground overflow-hidden',
        )}
      >
        <EditorToolbar editor={editor} />
        <TextEditor
          title={title}
          body={body}
          onChange={handleChange}
          onEditorReady={setEditor}
          fontSize={fontSize}
          fontFamily={fontFamily}
        />
      </div>
      <EditorWordCount text={body} />
    </div>
  );
};
