import { useMemo } from 'react';
import { Store, useStore } from '@tanstack/react-store';
import { NavigationState } from '~types/state/navigation-state';
import { ViewMode } from '~types/story';

export const createInitialNavigationState = (): NavigationState => ({
  currentView: ViewMode.legacy,
  currentCannonId: null,
  currentStoryId: null,
  currentDocumentId: null,
  selectedDocumentId: null,
});

export interface NavigationActions {
  setView: (view: ViewMode) => void;
  navigateUp: () => void;
  navigateToEditor: (documentId: string, storyId: string, cannonId: string) => void;
  navigateToStory: (storyId: string, cannonId: string) => void;
  navigateToCannon: (cannonId: string) => void;
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
          return { ...state, currentView: ViewMode.cannonView };
        case ViewMode.cannonView:
          return { ...state, currentView: ViewMode.legacy };
        default:
          return state;
      }
    });
  },

  navigateToEditor: (documentId, storyId, cannonId) => {
    navigationStore.setState((state) => ({
      ...state,
      currentView: ViewMode.editor,
      currentCannonId: cannonId,
      currentStoryId: storyId,
      currentDocumentId: documentId,
      selectedDocumentId: documentId,
    }));
  },

  navigateToStory: (storyId, cannonId) => {
    navigationStore.setState((state) => ({
      ...state,
      currentView: ViewMode.storyView,
      currentCannonId: cannonId,
      currentStoryId: storyId,
      selectedDocumentId: null,
    }));
  },

  navigateToCannon: (cannonId) => {
    navigationStore.setState((state) => ({
      ...state,
      currentView: ViewMode.cannonView,
      currentCannonId: cannonId,
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
