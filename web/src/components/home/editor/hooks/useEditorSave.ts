import { useCallback, useEffect, useRef } from 'react';
import { editorStoreSnapshot } from '~store/useEditorStore';
import { useUpsertDocumentMutation } from '~lib/mutations/story';

const FIVE_MINUTES = 5 * 60 * 1000;
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

  // Refs let handleSave always read the latest title/body without being in its dependency array,
  // which would otherwise recreate the interval on every keystroke.
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
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }, [upsertDocument, markSaved, currentDocumentId, currentStoryId]);

  // After the first save, start an interval to save every 5 minutes.
  useEffect(() => {
    intervalRef.current = setInterval(handleSave, FIVE_MINUTES);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [handleSave]);

  return handleSave;
};
