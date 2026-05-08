import { useMemo } from 'react';
import { Store, useStore } from '@tanstack/react-store';
import { EditorActions, EditorState, EditorStore } from '~types/state/editor-state';

function createInitialEditorState(): EditorState {
  return {
    isDirty: false,
    lastSaved: null,
    fontSize: 18,
    fontFamily: 'Georgia, serif',
  };
}

const editorStore = new Store<EditorState>(createInitialEditorState());

export const editorStoreSnapshot = () => editorStore.state;

const editorActions: EditorActions = {
  markDirty: () => {
    editorStore.setState((state) => ({ ...state, isDirty: true }));
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
    editorStore.setState((state) => ({ ...state, isDirty: false, lastSaved: null }));
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
