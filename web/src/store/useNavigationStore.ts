import { useMemo } from 'react';
import { Store, useStore } from '@tanstack/react-store';
import { NavigationState } from '~types/state/navigation-state';
import { ViewMode } from '~types/story';

export const createInitialNavigationState = (): NavigationState => ({
  currentView: ViewMode.legacy,
  currentWorldId: null,
  currentStoryId: null,
  currentDocumentId: null,
  selectedDocumentId: null,
});

export interface NavigationActions {
  setView: (view: ViewMode) => void;
  navigateUp: () => void;
  navigateToEditor: (documentId: string, storyId: string, worldId: string) => void;
  navigateToStory: (storyId: string, worldId: string) => void;
  navigateToWorld: (worldId: string) => void;
  navigateToLegacy: () => void;
  selectDocument: (id: string | null) => void;
  setCurrentDocument: (documentId: string | null) => void;
}

export const navigationStore = new Store<NavigationState>(createInitialNavigationState());

export const navigationActions: NavigationActions = {
  setView: (view) => {
    navigationStore.setState((state) => ({ ...state, currentView: view }));
  },

  navigateUp: () => {
    navigationStore.setState((state) => {
      switch (state.currentView) {
        case ViewMode.editor:
          return { ...state, currentView: ViewMode.storyView };
        case ViewMode.storyView:
          return { ...state, currentView: ViewMode.worldView };
        case ViewMode.worldView:
          return { ...state, currentView: ViewMode.legacy };
        default:
          return state;
      }
    });
  },

  navigateToEditor: (documentId, storyId, worldId) => {
    navigationStore.setState((state) => ({
      ...state,
      currentView: ViewMode.editor,
      currentWorldId: worldId,
      currentStoryId: storyId,
      currentDocumentId: documentId,
      selectedDocumentId: documentId,
    }));
  },

  navigateToStory: (storyId, worldId) => {
    navigationStore.setState((state) => ({
      ...state,
      currentView: ViewMode.storyView,
      currentWorldId: worldId,
      currentStoryId: storyId,
      selectedDocumentId: null,
    }));
  },

  navigateToWorld: (worldId) => {
    navigationStore.setState((state) => ({
      ...state,
      currentView: ViewMode.worldView,
      currentWorldId: worldId,
      currentStoryId: null,
      selectedDocumentId: null,
    }));
  },

  navigateToLegacy: () => {
    navigationStore.setState((state) => ({
      ...state,
      currentView: ViewMode.legacy,
      selectedDocumentId: null,
    }));
  },

  selectDocument: (id) => {
    navigationStore.setState((state) => ({ ...state, selectedDocumentId: id }));
  },

  setCurrentDocument: (documentId) => {
    navigationStore.setState((state) => ({ ...state, currentDocumentId: documentId }));
  },
};

type NavigationStore = NavigationState & NavigationActions;

export const useNavigationStore = (): NavigationStore => {
  const state = useStore(navigationStore, (currentState) => currentState);

  return useMemo(
    () => ({
      ...state,
      ...navigationActions,
    }),
    [state],
  );
};
