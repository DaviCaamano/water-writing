import { useCallback, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';

type PlaceHolderProps = {
  editor: Editor;
  node: Node;
  pos: number;
  hasAnchor: boolean;
}
type PlaceHolderCallback = (placeHolderProps: PlaceHolderProps) => string;
export interface UseEditorPlaceholderProps {
  bodyPlaceholder?: string;
  titlePlaceholder?: string;
}
export const useEditorPlaceholder = ({
  titlePlaceholder = 'Untitled Document',
  bodyPlaceholder = 'Start writing...',
}: UseEditorPlaceholderProps): PlaceHolderCallback => {
  // Placeholder Text
  const placeholderRef = useRef({ title: titlePlaceholder, body: bodyPlaceholder });

  useEffect(() => {
    placeholderRef.current = { title: titlePlaceholder, body: bodyPlaceholder };
  }, [titlePlaceholder, bodyPlaceholder]);

  return useCallback(
    ({ node }: PlaceHolderProps) =>
      node.type.name === 'title' ? placeholderRef.current.title : placeholderRef.current.body,
    [],
  );
};
