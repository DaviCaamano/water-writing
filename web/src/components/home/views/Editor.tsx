'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Editor as TiptapEditor } from '@tiptap/react';
import { useParams, useRouter } from 'next/navigation';
import { useEditorStore } from '~store/useEditorStore';
import { useUserStore } from '~store/useUserStore';
import { cn } from '~utils/merge-css-classes';
import { EditorToolbar } from '~components/home/editor/EditorToolbar';
import { TextEditor } from '~components/home/editor/TextEditor';
import { EditorWordCount } from '~components/home/editor/EditorWordCount';
import { normalizeEditorBody } from '~components/home/editor/helpers/markdown';
import { useEditorQuery } from '~components/home/editor/hooks/useEditorQuery';
import { useDocumentQuery } from '~lib/queries/story';
import { DocumentResponse } from '#types/shared/response';
import { useEditorSave } from '~components/home/editor/hooks/useEditorSave';
import { KeyDownModifier, useKeyDown } from '~hooks/useKeyDown';
import { useEditorLink } from '~components/home/editor/hooks/useEditorLink';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Editor = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [editor, setEditor] = useState<TiptapEditor | null>(null);

  const params = useParams<{ documentId?: string }>();
  const router = useRouter();
  const { lastViewedDocumentId, isLoggedIn } = useUserStore();
  const { fontSize, fontFamily, markDirty, markSaved } = useEditorStore();

  const urlDocumentId = params.documentId ?? null;
  const isValidUrlId = urlDocumentId !== null && UUID_REGEX.test(urlDocumentId);

  const requestedId = isValidUrlId ? urlDocumentId : null;
  const { error: requestedError } = useDocumentQuery(requestedId);

  const effectiveDocumentId = useMemo(() => {
    if (requestedId && !requestedError) return requestedId;
    return lastViewedDocumentId;
  }, [requestedId, requestedError, lastViewedDocumentId]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (urlDocumentId === effectiveDocumentId) return;
    if (effectiveDocumentId) {
      router.replace(`/d/${effectiveDocumentId}`);
    }
  }, [isLoggedIn, urlDocumentId, effectiveDocumentId, router]);

  const documentData = useEditorQuery(
    effectiveDocumentId,
    useCallback((data: DocumentResponse) => {
      setTitle(data.title);
      setBody(data.body);
    }, []),
  );

  const handleSave = useEditorSave({
    currentStoryId: documentData?.storyId,
    currentDocumentId: effectiveDocumentId,
    body,
    markSaved,
    title,
  });

  const handleLink = useEditorLink(editor);

  useKeyDown(
    useMemo(
      () => [
        {
          key: 's',
          modifiers: [[KeyDownModifier.ctrl], [KeyDownModifier.meta]],
          preventDefault: true,
          handler: handleSave,
        },
        {
          key: 'k',
          modifiers: [[KeyDownModifier.ctrl], [KeyDownModifier.meta]],
          preventDefault: true,
          handler: handleLink,
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

  if (!effectiveDocumentId) {
    return (
      <div className='-editor- h-100vh w-full max-w-[calc(65ch+6rem)] mx-auto bg-transparent flex items-center justify-center'>
        <p className='text-muted-foreground text-sm'>
          Create a document from the sidebar to begin writing.
        </p>
      </div>
    );
  }

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
          setEditor={setEditor}
          fontSize={fontSize}
          fontFamily={fontFamily}
        />
      </div>
      <EditorWordCount text={body} />
    </div>
  );
};
