import { useCallback, useEffect, useRef } from 'react';
import { editorStoreSnapshot } from '~store/useEditorStore';
import { useUpsertDocumentMutation } from '~lib/mutations/story';

interface UseEditorSaveProps {
  body: string;
  currentDocumentId: string | null | undefined;
  currentStoryId: string | null | undefined;
  markSaved: () => void;
  title: string;
}

// Handles saving specific functionality for the editor.
export const useEditorSave = ({
  body,
  currentDocumentId,
  currentStoryId,
  markSaved,
  title,
}: UseEditorSaveProps) => {
  const titleRef = useRef(title);
  const bodyRef = useRef(body);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const upsertDocument = useUpsertDocumentMutation();

  // Update the refs when the title or body changes.
  // Becaise
  useEffect(() => {
    titleRef.current = title;
    bodyRef.current = body;
  });

  const handleSave = useCallback(async () => {
    const snapshot = editorStoreSnapshot();
    if (!snapshot.isDirty || !currentDocumentId) return;
    try {
      await upsertDocument.mutateAsync({
        documentId: currentDocumentId,
        storyId: currentStoryId ?? undefined,
        title: titleRef.current,
        body: bodyRef.current,
      });
      markSaved();
    } catch (e) {
      console.error('Auto-save failed:', e);
    }
  }, [upsertDocument, markSaved, currentDocumentId, currentStoryId]);

  useEffect(() => {
    intervalRef.current = setInterval(handleSave, 5 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [handleSave]);

  return handleSave;
};
