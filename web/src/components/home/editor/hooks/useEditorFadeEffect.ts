import { useEffect, useState } from 'react';
import { Editor } from '@tiptap/core';

export const useEditorFadeEffect = (editor: Editor | null) => {
  // Hide fade out effect on text when document is scrolled to the bottom.
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Check if editor is scrolled to the bottom to hide the fade effect at the bottom of the editor.
  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom as HTMLElement;
    const check = () => {
      setIsAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
    };
    check();
    el.addEventListener('scroll', check);
    return () => el.removeEventListener('scroll', check);
  }, [editor]);

  return isAtBottom;
};
