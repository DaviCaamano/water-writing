import { useDocumentQuery } from '~lib/queries/story';
import { useEffect, useRef } from 'react';
import { DocumentResponse } from '#types/shared/response';

// Query the document data and initialize the initial state of the editor with it.
export const useEditorQuery = (
  documentId: string | null | undefined,
  initializer: (data: DocumentResponse) => void,
) => {
  const hasInitialized = useRef(false);
  const initializerCallback = useRef(initializer);

  const { data: documentData } = useDocumentQuery(documentId);

  // One-time initialization from query data
  useEffect(() => {
    if (!documentData || hasInitialized.current) return;
    hasInitialized.current = true;
    initializerCallback.current(documentData);
  }, [documentData]);

  return documentData;
};
