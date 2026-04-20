import { create } from 'zustand';
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

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentView: 'editor',
  currentWorldId: null,
  currentStoryId: null,
  currentDocumentId: null,
  worlds: [],
  currentStory: null,
  currentWorld: null,
  selectedDocumentId: null,

  setView: (view) => set({ currentView: view }),

  navigateUp: () => {
    const { currentView, currentStoryId, currentWorldId } = get();
    switch (currentView) {
      case 'editor':
        set({ currentView: 'story-canvas', selectedDocumentId: null });
        if (currentStoryId) get().loadStory(currentStoryId);
        break;
      case 'story-canvas':
        set({ currentView: 'world-canvas', selectedDocumentId: null });
        if (currentWorldId) get().loadWorld(currentWorldId);
        break;
      case 'world-canvas':
        set({ currentView: 'legacy' });
        get().loadLegacy();
        break;
    }
  },

  navigateToEditor: (documentId, storyId, worldId) => {
    set({
      currentView: 'editor',
      currentDocumentId: documentId,
      currentStoryId: storyId,
      currentWorldId: worldId,
      selectedDocumentId: null,
    });
  },

  navigateToStory: (storyId, worldId) => {
    set({
      currentView: 'story-canvas',
      currentStoryId: storyId,
      currentWorldId: worldId,
      selectedDocumentId: null,
    });
    get().loadStory(storyId);
  },

  navigateToWorld: (worldId) => {
    set({
      currentView: 'world-canvas',
      currentWorldId: worldId,
    });
    get().loadWorld(worldId);
  },

  navigateToLegacy: () => {
    set({ currentView: 'legacy' });
    get().loadLegacy();
  },

  selectDocument: (id) => set({ selectedDocumentId: id }),

  loadStory: async (storyId) => {
    try {
      const story = await api<Story>(`/story/${storyId}`);
      set({ currentStory: story });
    } catch (e) {
      console.error('Failed to load story:', e);
    }
  },

  loadWorld: async (worldId) => {
    try {
      const world = await api<World>(`/world/${worldId}`);
      set({ currentWorld: world });
    } catch (e) {
      console.error('Failed to load world:', e);
    }
  },

  loadLegacy: async () => {
    try {
      const worlds = await api<World[]>('/worlds');
      set({ worlds });
    } catch (e) {
      console.error('Failed to load legacy:', e);
    }
  },
}));
