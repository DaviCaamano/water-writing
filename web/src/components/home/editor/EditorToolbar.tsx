'use client';

import type { RefObject } from 'react';
import { useCallback, useEffect, useState } from 'react';
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
import { useEditorStore } from '~store/useEditorStore';
import { cn } from '~utils/merge-css-classes';

/* ── Markdown helpers ──────────────────────────────────── */

export interface MarkdownSyntax {
    prefix: string;
    suffix: string;
    line?: boolean;
    block?: boolean;
    placeholder?: string;
}

function applyInline(textarea: HTMLTextAreaElement, setBody: (body: string) => void, syntax: MarkdownSyntax) {
    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);

    // Toggle off if selection (or its immediate surroundings) already has the wrap
    const wrapsSelection =
        selected.startsWith(syntax.prefix) && selected.endsWith(syntax.suffix) &&
        selected.length >= syntax.prefix.length + syntax.suffix.length;
    const surrounds =
        before.endsWith(syntax.prefix) && after.startsWith(syntax.suffix);

    if (wrapsSelection) {
        const inner = selected.slice(syntax.prefix.length, selected.length - syntax.suffix.length);
        const newText = before + inner + after;
        setBody(newText);
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(selectionStart, selectionStart + inner.length);
        });
        return;
    }
    if (surrounds) {
        const newText = before.slice(0, before.length - syntax.prefix.length) + selected + after.slice(syntax.suffix.length);
        setBody(newText);
        requestAnimationFrame(() => {
            textarea.focus();
            const newStart = selectionStart - syntax.prefix.length;
            textarea.setSelectionRange(newStart, newStart + selected.length);
        });
        return;
    }

    const inner = selected || syntax.placeholder || '';
    const newText = before + syntax.prefix + inner + syntax.suffix + after;
    setBody(newText);
    requestAnimationFrame(() => {
        textarea.focus();
        const newStart = selectionStart + syntax.prefix.length;
        textarea.setSelectionRange(newStart, newStart + inner.length);
    });
}

function applyLine(textarea: HTMLTextAreaElement, setBody: (body: string) => void, syntax: MarkdownSyntax) {
    const { selectionStart, selectionEnd, value } = textarea;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const rawEnd = value.indexOf('\n', selectionEnd);
    const lineEnd = rawEnd === -1 ? value.length : rawEnd;
    const line = value.slice(lineStart, lineEnd);

    if (line.startsWith(syntax.prefix)) {
        const stripped = line.slice(syntax.prefix.length);
        const newText = value.slice(0, lineStart) + stripped + value.slice(lineEnd);
        setBody(newText);
        requestAnimationFrame(() => {
            textarea.focus();
            const offset = -syntax.prefix.length;
            textarea.setSelectionRange(
                Math.max(lineStart, selectionStart + offset),
                Math.max(lineStart, selectionEnd + offset),
            );
        });
        return;
    }

    const newText = value.slice(0, lineStart) + syntax.prefix + line + value.slice(lineEnd);
    setBody(newText);
    requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(
            selectionStart + syntax.prefix.length,
            selectionEnd + syntax.prefix.length,
        );
    });
}

function applyBlock(textarea: HTMLTextAreaElement, setBody: (body: string) => void, syntax: MarkdownSyntax) {
    const { selectionStart, selectionEnd, value } = textarea;
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);
    const inner = value.slice(selectionStart, selectionEnd) || syntax.placeholder || '';
    const needsLeadingNewlines = before.length > 0 && !before.endsWith('\n\n');
    const needsTrailingNewlines = after.length > 0 && !after.startsWith('\n\n');
    const lead = needsLeadingNewlines ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
    const trail = needsTrailingNewlines ? (after.startsWith('\n') ? '\n' : '\n\n') : '';
    const newText = before + lead + syntax.prefix + inner + syntax.suffix + trail + after;
    setBody(newText);
    requestAnimationFrame(() => {
        textarea.focus();
        const newStart = selectionStart + lead.length + syntax.prefix.length;
        textarea.setSelectionRange(newStart, newStart + inner.length);
    });
}

export function applyMarkdown(
    textarea: HTMLTextAreaElement,
    setBody: (body: string) => void,
    syntax: MarkdownSyntax,
) {
    if (syntax.block) return applyBlock(textarea, setBody, syntax);
    if (syntax.line) return applyLine(textarea, setBody, syntax);
    return applyInline(textarea, setBody, syntax);
}

export function insertLink(
    textarea: HTMLTextAreaElement,
    setBody: (body: string) => void,
    url: string,
) {
    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd) || 'link text';
    const newText = value.slice(0, selectionStart) + `[${selected}](${url})` + value.slice(selectionEnd);
    setBody(newText);
    requestAnimationFrame(() => {
        textarea.focus();
        const newStart = selectionStart + 1;
        textarea.setSelectionRange(newStart, newStart + selected.length);
    });
}

/* ── Active-state detection ────────────────────────────── */

interface ActiveState {
    bold: boolean;
    italic: boolean;
    strike: boolean;
    code: boolean;
    h1: boolean;
    h2: boolean;
    h3: boolean;
    quote: boolean;
    ul: boolean;
    ol: boolean;
    todo: boolean;
}

function detectActive(textarea: HTMLTextAreaElement): ActiveState {
    const { selectionStart, selectionEnd, value } = textarea;
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);
    const selected = value.slice(selectionStart, selectionEnd);

    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const rawLineEnd = value.indexOf('\n', selectionEnd);
    const lineEnd = rawLineEnd === -1 ? value.length : rawLineEnd;
    const line = value.slice(lineStart, lineEnd);

    const wraps = (p: string, s: string) =>
        (selected.startsWith(p) && selected.endsWith(s) && selected.length >= p.length + s.length) ||
        (before.endsWith(p) && after.startsWith(s));

    return {
        bold: wraps('**', '**'),
        italic: wraps('_', '_') || wraps('*', '*'),
        strike: wraps('~~', '~~'),
        code: wraps('`', '`'),
        h1: line.startsWith('# '),
        h2: line.startsWith('## '),
        h3: line.startsWith('### '),
        quote: line.startsWith('> '),
        ul: /^[-*] /.test(line),
        ol: /^\d+\. /.test(line),
        todo: /^- \[[ x]\] /.test(line),
    };
}

/* ── History (undo/redo) ───────────────────────────────── */

const MAX_HISTORY = 100;

interface HistoryFrame {
    body: string;
    cursor: number;
}

class History {
    private past: HistoryFrame[] = [];
    private future: HistoryFrame[] = [];
    push(frame: HistoryFrame) {
        this.past.push(frame);
        if (this.past.length > MAX_HISTORY) this.past.shift();
        this.future = [];
    }
    undo(current: HistoryFrame): HistoryFrame | null {
        const prev = this.past.pop();
        if (!prev) return null;
        this.future.push(current);
        return prev;
    }
    redo(current: HistoryFrame): HistoryFrame | null {
        const next = this.future.pop();
        if (!next) return null;
        this.past.push(current);
        return next;
    }
    canUndo() { return this.past.length > 0; }
    canRedo() { return this.future.length > 0; }
}

/* ── Component ─────────────────────────────────────────── */

interface EditorToolbarProps {
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    wordCount: number;
    charCount: number;
    history: History;
    onHistoryChange: () => void;
}

interface ToolButtonProps {
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
}

function ToolButton({ icon, label, shortcut, active, disabled, onClick }: ToolButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <WaterRipple className="rounded-md" maxTilt={3} disabled={disabled}>
                    <button
                        type="button"
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
            <TooltipContent side="bottom">
                <span>{label}</span>
                {shortcut && <span className="ml-1.5 opacity-50 text-[10px]">{shortcut}</span>}
            </TooltipContent>
        </Tooltip>
    );
}

function Separator() {
    return <div aria-hidden="true" className="mx-1 h-3.5 w-px bg-temp opacity-15 shrink-0" />;
}

export function EditorToolbar({
    textareaRef,
    wordCount,
    charCount,
    history,
    onHistoryChange,
}: EditorToolbarProps) {
    const { setBody } = useEditorStore();
    const [active, setActive] = useState<ActiveState | null>(null);

    const refreshActive = useCallback(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        setActive(detectActive(ta));
    }, [textareaRef]);

    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        const handler = () => refreshActive();
        ta.addEventListener('keyup', handler);
        ta.addEventListener('mouseup', handler);
        ta.addEventListener('select', handler);
        ta.addEventListener('focus', handler);
        document.addEventListener('selectionchange', handler);
        return () => {
            ta.removeEventListener('keyup', handler);
            ta.removeEventListener('mouseup', handler);
            ta.removeEventListener('select', handler);
            ta.removeEventListener('focus', handler);
            document.removeEventListener('selectionchange', handler);
        };
    }, [textareaRef, refreshActive]);

    const run = useCallback((syntax: MarkdownSyntax) => {
        const ta = textareaRef.current;
        if (!ta) return;
        applyMarkdown(ta, setBody, syntax);
        requestAnimationFrame(refreshActive);
    }, [textareaRef, setBody, refreshActive]);

    const handleLink = useCallback(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        const url = window.prompt('Link URL', 'https://');
        if (!url) return;
        insertLink(ta, setBody, url);
    }, [textareaRef, setBody]);

    const handleUndo = useCallback(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        const frame = history.undo({ body: ta.value, cursor: ta.selectionStart });
        if (!frame) return;
        setBody(frame.body);
        requestAnimationFrame(() => {
            ta.focus();
            ta.setSelectionRange(frame.cursor, frame.cursor);
            onHistoryChange();
        });
    }, [textareaRef, setBody, history, onHistoryChange]);

    const handleRedo = useCallback(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        const frame = history.redo({ body: ta.value, cursor: ta.selectionStart });
        if (!frame) return;
        setBody(frame.body);
        requestAnimationFrame(() => {
            ta.focus();
            ta.setSelectionRange(frame.cursor, frame.cursor);
            onHistoryChange();
        });
    }, [textareaRef, setBody, history, onHistoryChange]);

    return (
        <div
            className={cn(
                '-editor-toolbar-',
                'flex items-center gap-0.5 flex-wrap',
                'px-12 py-1.5',
                'border-y border-border/40',
                'sticky top-0 z-10 backdrop-blur-sm',
            )}
        >
            <ToolButton
                icon={<Undo2 size={13} strokeWidth={2.2} />}
                label="Undo"
                shortcut="⌘Z"
                disabled={!history.canUndo()}
                onClick={handleUndo}
            />
            <ToolButton
                icon={<Redo2 size={13} strokeWidth={2.2} />}
                label="Redo"
                shortcut="⌘⇧Z"
                disabled={!history.canRedo()}
                onClick={handleRedo}
            />

            <Separator />

            <ToolButton
                icon={<Bold size={13} strokeWidth={2.5} />}
                label="Bold"
                shortcut="⌘B"
                active={active?.bold}
                onClick={() => run({ prefix: '**', suffix: '**', placeholder: 'bold text' })}
            />
            <ToolButton
                icon={<Italic size={13} strokeWidth={2.5} />}
                label="Italic"
                shortcut="⌘I"
                active={active?.italic}
                onClick={() => run({ prefix: '_', suffix: '_', placeholder: 'italic text' })}
            />
            <ToolButton
                icon={<Strikethrough size={13} strokeWidth={2.5} />}
                label="Strikethrough"
                shortcut="⌘⇧X"
                active={active?.strike}
                onClick={() => run({ prefix: '~~', suffix: '~~', placeholder: 'struck text' })}
            />
            <ToolButton
                icon={<Code size={13} strokeWidth={2.2} />}
                label="Inline code"
                shortcut="⌘E"
                active={active?.code}
                onClick={() => run({ prefix: '`', suffix: '`', placeholder: 'code' })}
            />

            <Separator />

            <ToolButton
                icon={<Heading1 size={13} strokeWidth={2} />}
                label="Heading 1"
                active={active?.h1}
                onClick={() => run({ prefix: '# ', suffix: '', line: true })}
            />
            <ToolButton
                icon={<Heading2 size={13} strokeWidth={2} />}
                label="Heading 2"
                active={active?.h2}
                onClick={() => run({ prefix: '## ', suffix: '', line: true })}
            />
            <ToolButton
                icon={<Heading3 size={13} strokeWidth={2} />}
                label="Heading 3"
                active={active?.h3}
                onClick={() => run({ prefix: '### ', suffix: '', line: true })}
            />

            <Separator />

            <ToolButton
                icon={<List size={13} strokeWidth={2.2} />}
                label="Bullet list"
                active={active?.ul}
                onClick={() => run({ prefix: '- ', suffix: '', line: true })}
            />
            <ToolButton
                icon={<ListOrdered size={13} strokeWidth={2.2} />}
                label="Numbered list"
                active={active?.ol}
                onClick={() => run({ prefix: '1. ', suffix: '', line: true })}
            />
            <ToolButton
                icon={<ListChecks size={13} strokeWidth={2.2} />}
                label="Task list"
                active={active?.todo}
                onClick={() => run({ prefix: '- [ ] ', suffix: '', line: true })}
            />

            <Separator />

            <ToolButton
                icon={<Quote size={13} strokeWidth={2} />}
                label="Blockquote"
                active={active?.quote}
                onClick={() => run({ prefix: '> ', suffix: '', line: true })}
            />
            <ToolButton
                icon={<LinkIcon size={13} strokeWidth={2.2} />}
                label="Insert link"
                shortcut="⌘K"
                onClick={handleLink}
            />
            <ToolButton
                icon={<Code2 size={13} strokeWidth={2.2} />}
                label="Code block"
                onClick={() => run({ prefix: '```\n', suffix: '\n```', block: true, placeholder: 'code' })}
            />
            <ToolButton
                icon={<Minus size={13} strokeWidth={2} />}
                label="Divider"
                onClick={() => run({ prefix: '\n\n---\n\n', suffix: '', placeholder: '' })}
            />

            <div className="ml-auto flex items-center gap-3 pr-1 text-[11px] font-medium opacity-30 tabular-nums select-none">
                <span>{charCount.toLocaleString()}&thinsp;ch</span>
                <span>{wordCount.toLocaleString()}&thinsp;{wordCount === 1 ? 'word' : 'words'}</span>
            </div>
        </div>
    );
}

export { History };
