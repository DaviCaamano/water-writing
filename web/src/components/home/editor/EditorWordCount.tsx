import { cn } from '~utils/merge-css-classes';

export interface EditorWordCountProps {
  charCount: number;
  wordCount: number;
}
export const EditorWordCount = ({ charCount, wordCount }: EditorWordCountProps) => {
  return (
    <div
      className={cn(
        'flex justify-end items-center gap-3',
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
