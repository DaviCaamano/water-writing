import { useMemo } from 'react';
import { Store, useStore } from '@tanstack/react-store';
import { api } from '@/lib/api';
import type { ViewMode, Story, World } from '@/types';

interface NavigationState {
  currentView: ViewMode;
  currentWorldId: string | null;
  currentStoryId: string | null;
  currentDocumentId: string | null;

  worlds: World[];
  currentStory: Story | null;
  currentWorld: World | null;
  selectedDocumentId: string | null;
}

interface NavigationActions {
  setView: (view: ViewMode) => void;
  navigateUp: () => void;
  navigateToEditor: (documentId: string, storyId: string, worldId: string) => void;
  navigateToStory: (storyId: string, worldId: string) => void;
  navigateToWorld: (worldId: string) => void;
  navigateToLegacy: () => void;
  selectDocument: (id: string | null) => void;
  loadStory: (storyId: string) => Promise<void>;
  loadWorld: (worldId: string) => Promise<void>;
  loadLegacy: () => Promise<void>;
}

function createInitialNavigationState(): NavigationState {
  return {
    currentView: 'editor',
    currentWorldId: null,
    currentStoryId: null,
    currentDocumentId: null,
    worlds: [],
    currentStory: null,
    currentWorld: null,
    selectedDocumentId: null,
  };
}

const navigationStore = new Store<NavigationState>(createInitialNavigationState());

const navigationActions: NavigationActions = {
  setView: (view) => {
    navigationStore.setState((state) => ({ ...state, currentView: view }));
  },

  navigateUp: () => {
    const { currentView, currentStoryId, currentWorldId } = navigationStore.state;
    switch (currentView) {
      case 'editor':
        navigationStore.setState((state) => ({
          ...state,
          currentView: 'story-canvas',
          selectedDocumentId: null,
        }));
        if (currentStoryId) {
          void navigationActions.loadStory(currentStoryId);
        }
        break;
      case 'story-canvas':
        navigationStore.setState((state) => ({
          ...state,
          currentView: 'world-canvas',
          selectedDocumentId: null,
        }));
        if (currentWorldId) {
          void navigationActions.loadWorld(currentWorldId);
        }
        break;
      case 'world-canvas':
        navigationStore.setState((state) => ({ ...state, currentView: 'legacy' }));
        void navigationActions.loadLegacy();
        break;
    }
  },

  navigateToEditor: (documentId, storyId, worldId) => {
    navigationStore.setState((state) => ({
      ...state,
      currentView: 'editor',
      currentDocumentId: documentId,
      currentStoryId: storyId,
      currentWorldId: worldId,
      selectedDocumentId: null,
    }));
  },

  navigateToStory: (storyId, worldId) => {
    navigationStore.setState((state) => ({
      ...state,
      currentView: 'story-canvas',
      currentStoryId: storyId,
      currentWorldId: worldId,
      selectedDocumentId: null,
    }));
    void navigationActions.loadStory(storyId);
  },

  navigateToWorld: (worldId) => {
    navigationStore.setState((state) => ({
      ...state,
      currentView: 'world-canvas',
      currentWorldId: worldId,
    }));
    void navigationActions.loadWorld(worldId);
  },

  navigateToLegacy: () => {
    navigationStore.setState((state) => ({ ...state, currentView: 'legacy' }));
    void navigationActions.loadLegacy();
  },

  selectDocument: (id) => {
    navigationStore.setState((state) => ({ ...state, selectedDocumentId: id }));
  },

  loadStory: async (storyId) => {
    try {
      const story = await api<Story>(`/story/${storyId}`);
      navigationStore.setState((state) => ({ ...state, currentStory: story }));
    } catch (e) {
      console.error('Failed to load story:', e);
    }
  },

  loadWorld: async (worldId) => {
    try {
      const world = await api<World>(`/world/${worldId}`);
      navigationStore.setState((state) => ({ ...state, currentWorld: world }));
    } catch (e) {
      console.error('Failed to load world:', e);
    }
  },

  loadLegacy: async () => {
    try {
      const worlds = await api<World[]>('/worlds');
      navigationStore.setState((state) => ({ ...state, worlds }));
    } catch (e) {
      console.error('Failed to load legacy:', e);
    }
  },
};

type NavigationStore = NavigationState & NavigationActions;

export function useNavigationStore(): NavigationStore {
  const state = useStore(navigationStore, (currentState) => currentState);

  return useMemo(
    () => ({
      ...state,
      ...navigationActions,
    }),
    [state],
  );
}
