import { create } from 'zustand';
import { api } from '@/lib/api';
import type { EditorTheme } from '@/types';

interface EditorState {
  documentId: string | null;
  storyId: string | null;
  title: string;
  body: string;
  isDirty: boolean;
  lastSaved: Date | null;
  fontSize: number;
  fontFamily: string;
  theme: EditorTheme;

  setTitle: (title: string) => void;
  setBody: (body: string) => void;
  saveDocument: () => Promise<void>;
  loadDocument: (doc: {
    id: string;
    title: string;
    body: string;
    storyId: string;
  }) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (font: string) => void;
  setTheme: (theme: EditorTheme) => void;
  resetEditor: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  documentId: null,
  storyId: null,
  title: '',
  body: '',
  isDirty: false,
  lastSaved: null,
  fontSize: 18,
  fontFamily: 'Georgia, serif',
  theme: 'light',

  setTitle: (title) => set({ title, isDirty: true }),
  setBody: (body) => set({ body, isDirty: true }),

  saveDocument: async () => {
    const { title, body, documentId, storyId } = get();
    await api('/story', {
      method: 'POST',
      body: JSON.stringify({ documentId, storyId, title, body }),
    });
    set({ isDirty: false, lastSaved: new Date() });
  },

  loadDocument: (doc) => {
    set({
      documentId: doc.id,
      storyId: doc.storyId,
      title: doc.title,
      body: doc.body,
      isDirty: false,
    });
  },

  setFontSize: (fontSize) => set({ fontSize }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setTheme: (theme) => set({ theme }),

  resetEditor: () =>
    set({
      documentId: null,
      storyId: null,
      title: '',
      body: '',
      isDirty: false,
      lastSaved: null,
    }),
}));
