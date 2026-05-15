import { cn } from '~utils/merge-css-classes';
import { useMemo } from 'react';

export interface EditorWordCountProps {
  text: string;
}
export const EditorWordCount = ({ text }: EditorWordCountProps) => {
  const charCount = text.length;

  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  }, [text]);

  return (
    <div
      className={cn(
        'flex justify-end items-center gap-3 h-6',
        'w-full ml-auto pr-1',
        'text-[11px] font-medium opacity-30 tabular-nums select-none',
      )}
    >
      <span>{charCount.toLocaleString()}&thinsp;ch</span>
      <span>
        {wordCount.toLocaleString()}&thinsp;{wordCount === 1 ? 'word' : 'words'}
      </span>
    </div>
  );
};
