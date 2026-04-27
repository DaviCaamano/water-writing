import { useMemo } from 'react';
import { Store, useStore } from '@tanstack/react-store';
import { EditorActions, EditorState, EditorStore } from '~types/state/editor-state';
import { DocumentResponse } from '#types/shared/response';

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
  };
}

const editorStore = new Store<EditorState>(createInitialEditorState());

export const editorStoreSnapshot = () => editorStore.state;

const editorActions: EditorActions = {
  setTitle: (title) => {
    editorStore.setState((state) => ({ ...state, title, isDirty: true }));
  },

  setBody: (body) => {
    editorStore.setState((state) => ({ ...state, body, isDirty: true }));
  },

  loadDocument: (doc: Pick<DocumentResponse, 'body' | 'documentId' | 'storyId' | 'title'>) => {
    editorStore.setState((state) => ({
      ...state,
      body: doc.body,
      documentId: doc.documentId,
      isDirty: false,
      storyId: doc.storyId,
      title: doc.title,
    }));
  },

  markSaved: () => {
    editorStore.setState((state) => ({ ...state, isDirty: false, lastSaved: new Date() }));
  },

  setFontSize: (fontSize) => {
    editorStore.setState((state) => ({ ...state, fontSize }));
  },

  setFontFamily: (fontFamily) => {
    editorStore.setState((state) => ({ ...state, fontFamily }));
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
