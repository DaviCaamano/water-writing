'use client';

import type { Editor as TiptapEditor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { useCallback } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  ListChecks,
  Link as LinkIcon,
  Minus,
  Undo2,
  Redo2,
  Code2,
} from 'lucide-react';
import { WaterRipple } from '~components/visual-effects/WaterRipple';
import { Tooltip, TooltipContent, TooltipTrigger } from '~components/ui/tooltip';
import { cn } from '~utils/merge-css-classes';
import { useEditorLink } from '~components/home/editor/hooks/useEditorLink';

interface EditorToolbarProps {
  editor: TiptapEditor | null;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean | undefined;
  disabled?: boolean | undefined;
  onClick: () => void;
}

const ToolButton = ({ icon, label, shortcut, active, disabled, onClick }: ToolButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <WaterRipple className='rounded-md' disabled={disabled}>
          <button
            type='button'
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            disabled={disabled}
            className={cn(
              'flex items-center justify-center',
              'size-7 rounded-md',
              'transition-all duration-150',
              'cursor-pointer',
              disabled
                ? 'opacity-20 cursor-not-allowed'
                : active
                  ? 'opacity-95 bg-primary-foreground/10'
                  : 'opacity-40 hover:opacity-85',
            )}
            aria-label={label}
            aria-pressed={active}
          >
            {icon}
          </button>
        </WaterRipple>
      </TooltipTrigger>
      <TooltipContent side='bottom'>
        <span>{label}</span>
        {shortcut && <span className='ml-1.5 opacity-50 text-[10px]'>{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  );
};

const Separator = () => {
  return <div aria-hidden='true' className='mx-1 h-3.5 w-px bg-foreground opacity-15 shrink-0' />;
};

export const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return {
          inTitle: false,
          canUndo: false,
          canRedo: false,
          bold: false,
          italic: false,
          strike: false,
          code: false,
          h1: false,
          h2: false,
          h3: false,
          quote: false,
          ul: false,
          ol: false,
          todo: false,
          codeBlock: false,
          link: false,
        };
      }
      return {
        inTitle: editor.state.selection.$from.parent.type.name === 'title',
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        strike: editor.isActive('strike'),
        code: editor.isActive('code'),
        h1: editor.isActive('heading', { level: 1 }),
        h2: editor.isActive('heading', { level: 2 }),
        h3: editor.isActive('heading', { level: 3 }),
        quote: editor.isActive('blockquote'),
        ul: editor.isActive('bulletList'),
        ol: editor.isActive('orderedList'),
        todo: editor.isActive('taskList'),
        codeBlock: editor.isActive('codeBlock'),
        link: editor.isActive('link'),
      };
    },
  });

  const handleLink = useEditorLink(editor);

  const run = useCallback(
    (fn: (chain: ReturnType<TiptapEditor['chain']>) => ReturnType<TiptapEditor['chain']>) => {
      if (!editor) return;
      fn(editor.chain().focus()).run();
    },
    [editor],
  );

  const disabled = !editor;
  const inTitle = state?.inTitle ?? false;

  return (
    <div
      className={cn(
        '-editor-toolbar-',
        'flex items-center gap-0.5 flex-wrap',
        'px-12 pt-1.5 pb-4 -mb-2.5',
        'sticky top-0 z-10',
        '[background:linear-gradient(to_bottom,var(--background)_calc(100%-10px),transparent_100%)]',
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='relative flex items-center gap-0.5 flex-wrap flex-1'>
            <ToolButton
              icon={<Undo2 size={13} strokeWidth={2.2} />}
              label='Undo'
              shortcut='⌘Z'
              disabled={disabled || !state?.canUndo}
              onClick={() => run((c) => c.undo())}
            />
            <ToolButton
              icon={<Redo2 size={13} strokeWidth={2.2} />}
              label='Redo'
              shortcut='⌘⇧Z'
              disabled={disabled || !state?.canRedo}
              onClick={() => run((c) => c.redo())}
            />

            <Separator />

            <ToolButton
              icon={<Bold size={13} strokeWidth={2.5} />}
              label='Bold'
              shortcut='⌘B'
              disabled={disabled || inTitle}
              active={state?.bold}
              onClick={() => run((c) => c.toggleBold())}
            />
            <ToolButton
              icon={<Italic size={13} strokeWidth={2.5} />}
              label='Italic'
              shortcut='⌘I'
              disabled={disabled || inTitle}
              active={state?.italic}
              onClick={() => run((c) => c.toggleItalic())}
            />
            <ToolButton
              icon={<Strikethrough size={13} strokeWidth={2.5} />}
              label='Strikethrough'
              shortcut='⌘⇧X'
              disabled={disabled || inTitle}
              active={state?.strike}
              onClick={() => run((c) => c.toggleStrike())}
            />
            <ToolButton
              icon={<Code size={13} strokeWidth={2.2} />}
              label='Inline code'
              shortcut='⌘E'
              disabled={disabled || inTitle}
              active={state?.code}
              onClick={() => run((c) => c.toggleCode())}
            />

            <Separator />

            <ToolButton
              icon={<Heading1 size={13} strokeWidth={2} />}
              label='Heading 1'
              disabled={disabled || inTitle}
              active={state?.h1}
              onClick={() => run((c) => c.toggleHeading({ level: 1 }))}
            />
            <ToolButton
              icon={<Heading2 size={13} strokeWidth={2} />}
              label='Heading 2'
              disabled={disabled || inTitle}
              active={state?.h2}
              onClick={() => run((c) => c.toggleHeading({ level: 2 }))}
            />
            <ToolButton
              icon={<Heading3 size={13} strokeWidth={2} />}
              label='Heading 3'
              disabled={disabled || inTitle}
              active={state?.h3}
              onClick={() => run((c) => c.toggleHeading({ level: 3 }))}
            />

            <Separator />

            <ToolButton
              icon={<List size={13} strokeWidth={2.2} />}
              label='Bullet list'
              disabled={disabled || inTitle}
              active={state?.ul}
              onClick={() => run((c) => c.toggleBulletList())}
            />
            <ToolButton
              icon={<ListOrdered size={13} strokeWidth={2.2} />}
              label='Numbered list'
              disabled={disabled || inTitle}
              active={state?.ol}
              onClick={() => run((c) => c.toggleOrderedList())}
            />
            <ToolButton
              icon={<ListChecks size={13} strokeWidth={2.2} />}
              label='Task list'
              disabled={disabled || inTitle}
              active={state?.todo}
              onClick={() => run((c) => c.toggleTaskList())}
            />

            <Separator />

            <ToolButton
              icon={<Quote size={13} strokeWidth={2} />}
              label='Blockquote'
              disabled={disabled || inTitle}
              active={state?.quote}
              onClick={() => run((c) => c.toggleBlockquote())}
            />
            <ToolButton
              icon={<LinkIcon size={13} strokeWidth={2.2} />}
              label='Insert link'
              shortcut='⌘K'
              disabled={disabled || inTitle}
              active={state?.link}
              onClick={handleLink}
            />
            <ToolButton
              icon={<Code2 size={13} strokeWidth={2.2} />}
              label='Code block'
              disabled={disabled || inTitle}
              active={state?.codeBlock}
              onClick={() => run((c) => c.toggleCodeBlock())}
            />
            <ToolButton
              icon={<Minus size={13} strokeWidth={2} />}
              label='Divider'
              disabled={disabled || inTitle}
              onClick={() => run((c) => c.setHorizontalRule())}
            />

            {inTitle && <div className='absolute inset-0 cursor-default' />}
          </div>
        </TooltipTrigger>
        {inTitle && <TooltipContent side='bottom'>Titles cannot be styled</TooltipContent>}
      </Tooltip>
    </div>
  );
};
