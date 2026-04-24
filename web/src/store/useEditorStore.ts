import { useMemo } from 'react';
import { Store, useStore } from '@tanstack/react-store';
import { api } from '~lib/api';
import { syncDocumentInNavigationStore } from '~store/useNavigationStore';
import type { EditorTheme } from '~types';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

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
}

interface EditorActions {
  setTitle: (title: string) => void;
  setBody: (body: string) => void;
  saveDocument: () => Promise<void>;
  loadDocument: (doc: { id: string; title: string; body: string; storyId: string }) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (font: string) => void;
  setTheme: (theme: EditorTheme) => void;
  resetEditor: () => void;
}

function createInitialEditorState(): EditorState {
  return {
    documentId: null,
    storyId: null,
    title: '',
    body: '',
    isDirty: false,
    lastSaved: null,
    fontSize: 18,
    fontFamily: 'Georgia, serif',
    theme: 'light',
  };
}

const editorStore = new Store<EditorState>(createInitialEditorState());

const editorActions: EditorActions = {
  setTitle: (title) => {
    editorStore.setState((state) => ({ ...state, title, isDirty: true }));
  },

  setBody: (body) => {
    editorStore.setState((state) => ({ ...state, body, isDirty: true }));
  },

  saveDocument: async () => {
    const { title, body, documentId, storyId } = editorStore.state;

    if (documentId) {
      syncDocumentInNavigationStore(documentId, { title, body });
    }

    if (!IS_DEVELOPMENT) {
      await api('/story', {
        method: 'POST',
        body: JSON.stringify({ documentId, storyId, title, body }),
      });
    }

    editorStore.setState((state) => ({ ...state, isDirty: false, lastSaved: new Date() }));
  },

  loadDocument: (doc) => {
    editorStore.setState((state) => ({
      ...state,
      documentId: doc.id,
      storyId: doc.storyId,
      title: doc.title,
      body: doc.body,
      isDirty: false,
    }));
  },

  setFontSize: (fontSize) => {
    editorStore.setState((state) => ({ ...state, fontSize }));
  },

  setFontFamily: (fontFamily) => {
    editorStore.setState((state) => ({ ...state, fontFamily }));
  },

  setTheme: (theme) => {
    editorStore.setState((state) => ({ ...state, theme }));
  },

  resetEditor: () => {
    editorStore.setState((state) => ({
      ...state,
      documentId: null,
      storyId: null,
      title: '',
      body: '',
      isDirty: false,
      lastSaved: null,
    }));
  },
};

type EditorStore = EditorState & EditorActions;

export function useEditorStore(): EditorStore {
  const state = useStore(editorStore, (currentState) => currentState);

  return useMemo(
    () => ({
      ...state,
      ...editorActions,
    }),
    [state],
  );
}
