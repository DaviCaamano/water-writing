'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { editorStoreSnapshot, useEditorStore } from '~store/useEditorStore';
import { useUpsertDocumentMutation } from '~lib/mutations/story';
import { cn } from '~utils/merge-css-classes';
import {
    EditorToolbar,
    applyMarkdown,
    insertLink,
    History,
} from '~components/home/editor/EditorToolbar';

const HISTORY_DEBOUNCE_MS = 400;

export function Editor() {
    const { title, body, fontSize, fontFamily, setTitle, setBody, markSaved } = useEditorStore();
    const bodyRef = useRef<HTMLTextAreaElement>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const upsertDocument = useUpsertDocumentMutation();

    const historyRef = useRef(new History());
    const lastSnapshotRef = useRef<{ body: string; cursor: number }>({ body, cursor: 0 });
    const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [, forceHistoryRender] = useState(0);
    const bumpHistory = useCallback(() => forceHistoryRender((n) => n + 1), []);

    const wordCount = useMemo(() => {
        const trimmed = body.trim();
        return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
    }, [body]);

    const charCount = body.length;

    const snapshotHistory = useCallback(() => {
        const ta = bodyRef.current;
        const last = lastSnapshotRef.current;
        if (!ta || ta.value === last.body) return;
        historyRef.current.push(last);
        lastSnapshotRef.current = { body: ta.value, cursor: ta.selectionStart };
        bumpHistory();
    }, [bumpHistory]);

    useEffect(() => {
        if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
        snapshotTimerRef.current = setTimeout(snapshotHistory, HISTORY_DEBOUNCE_MS);
        return () => {
            if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
        };
    }, [body, snapshotHistory]);

    const handleSave = useCallback(async () => {
        const snapshot = editorStoreSnapshot();
        if (!snapshot.isDirty || !snapshot.documentId) return;
        try {
            await upsertDocument.mutateAsync({
                documentId: snapshot.documentId,
                storyId: snapshot.storyId ?? undefined,
                title: snapshot.title,
                body: snapshot.body,
            });
            markSaved();
        } catch (e) {
            console.error('Auto-save failed:', e);
        }
    }, [upsertDocument, markSaved]);

    useEffect(() => {
        intervalRef.current = setInterval(handleSave, 5 * 60 * 1000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [handleSave]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            const ta = bodyRef.current;

            if (e.key === 's') {
                e.preventDefault();
                void handleSave();
                return;
            }

            if (e.key === 'z' && !e.shiftKey) {
                if (!ta) return;
                e.preventDefault();
                snapshotHistory();
                const frame = historyRef.current.undo({ body: ta.value, cursor: ta.selectionStart });
                if (frame) {
                    setBody(frame.body);
                    lastSnapshotRef.current = frame;
                    requestAnimationFrame(() => {
                        ta.focus();
                        ta.setSelectionRange(frame.cursor, frame.cursor);
                        bumpHistory();
                    });
                }
                return;
            }

            if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
                if (!ta) return;
                e.preventDefault();
                const frame = historyRef.current.redo({ body: ta.value, cursor: ta.selectionStart });
                if (frame) {
                    setBody(frame.body);
                    lastSnapshotRef.current = frame;
                    requestAnimationFrame(() => {
                        ta.focus();
                        ta.setSelectionRange(frame.cursor, frame.cursor);
                        bumpHistory();
                    });
                }
                return;
            }

            if (!ta) return;

            if (e.key === 'b') {
                e.preventDefault();
                applyMarkdown(ta, setBody, { prefix: '**', suffix: '**', placeholder: 'bold text' });
                return;
            }
            if (e.key === 'i') {
                e.preventDefault();
                applyMarkdown(ta, setBody, { prefix: '_', suffix: '_', placeholder: 'italic text' });
                return;
            }
            if (e.key === 'e') {
                e.preventDefault();
                applyMarkdown(ta, setBody, { prefix: '`', suffix: '`', placeholder: 'code' });
                return;
            }
            if (e.key === 'k') {
                e.preventDefault();
                const url = window.prompt('Link URL', 'https://');
                if (url) insertLink(ta, setBody, url);
                return;
            }
            if (e.key === 'X' && e.shiftKey) {
                e.preventDefault();
                applyMarkdown(ta, setBody, { prefix: '~~', suffix: '~~', placeholder: 'struck text' });
                return;
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleSave, setBody, snapshotHistory, bumpHistory]);

    return (
        <div
            className={cn(
                '-editor- ',
                'flex-1 flex flex-col',
                'w-full h-[calc(100vh-2rem)] max-w-[65ch] mx-auto',
                'my-2 border-2 border-border rounded-lg',
                'bg-temp shadow-background shadow-2xl',
                'text-black overflow-hidden',
            )}
        >
            <input
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Untitled Document'
                className='w-full bg-transparent border-none outline-none px-12 pt-16 pb-2'
                style={{
                    fontSize: fontSize * 1.8,
                    lineHeight: 1.4,
                    fontFamily,
                    fontWeight: 700,
                }}
            />

            <EditorToolbar
                textareaRef={bodyRef}
                wordCount={wordCount}
                charCount={charCount}
                history={historyRef.current}
                onHistoryChange={bumpHistory}
            />

            <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='Start writing...'
                className='flex-1 w-full bg-transparent border-none outline-none resize-none px-12 py-4 overflow-auto'
                style={{
                    fontSize,
                    lineHeight: 1.8,
                    fontFamily,
                }}
            />
        </div>
    );
}
