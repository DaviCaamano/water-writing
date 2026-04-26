import { useMemo } from 'react';
import { Store, useStore } from '@tanstack/react-store';
import { queryApi } from '~lib/api';
import { Document, Story, ViewMode, World } from '~types/story';
import { mapStoryState, mapWorldState } from '~utils/map-story-state';
import { StoryResponse, WorldResponse } from '#types/shared/response';
import { apiRoutes } from '#types/shared/api-route';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

export enum DocumentMovePosition {
  first = 'first',
  earlier = 'earlier',
  later = 'later',
  last = 'last',
}

interface NavigationState {
  currentView: ViewMode;
  currentWorldId: string | null;
  currentStoryId: string | null;
  currentDocumentId: string | null;
  worlds: World[];
  selectedDocumentId: string | null;
}

interface CreatedItem {
  id: string;
  title: string;
}

interface StoryLocation {
  world: World;
  story: Story;
}

interface DocumentLocation {
  world: World;
  story: Story;
  document: Document;
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
  createWorld: (userId: string) => CreatedItem;
  renameWorld: (worldId: string, title: string) => void;
  deleteWorld: (worldId: string) => void;
  updateWorldCover: (worldId: string, coverImage: string) => void;
  createStory: (worldId: string) => CreatedItem | null;
  renameStory: (storyId: string, title: string) => void;
  deleteStory: (storyId: string) => void;
  moveStoryToWorld: (storyId: string, targetWorldId: string) => void;
  updateStory: (storyId: string, updatingStory: Partial<Story>) => void;
  createDocument: (storyId: string) => CreatedItem | null;
  deleteDocument: (documentId: string) => void;
  moveDocumentToStory: (documentId: string, targetStoryId: string) => void;
  moveDocumentPosition: (documentId: string, position: DocumentMovePosition) => void;
  updateDocument: (documentId: string, updates: Partial<Document>) => void;
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateTitle(existingNames: string[], baseName: string): string {
  let index = 1;

  while (existingNames.includes(`${baseName} ${index}`)) {
    index += 1;
  }

  return `${baseName} ${index}`;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items;

  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

function normalizeStory(story: Story): Story {
  const source = story.documents;
  const documents: Document[] = source.map((document, index) => ({
    ...document,
    storyId: story.id,
    predecessorId: index > 0 ? source[index - 1].id : null,
    successorId: index < source.length - 1 ? source[index + 1].id : null,
  }));

  return {
    ...story,
    documents,
  };
}

function normalizeWorlds(worlds: World[]): World[] {
  return worlds.map((world: World) => ({
    ...world,
    stories: world.stories.map((story) =>
      normalizeStory({
        ...story,
        worldId: world.id,
      }),
    ),
  }));
}

function findWorld(worlds: World[], worldId: string | null): World | null {
  if (!worldId) return null;
  return worlds.find((world) => world.id === worldId) ?? null;
}

function findStory(worlds: World[], storyId: string | null): StoryLocation | null {
  if (!storyId) return null;

  for (const world of worlds) {
    const story = world.stories.find((entry) => entry.id === storyId);
    if (story) {
      return { world, story };
    }
  }

  return null;
}

function findDocument(worlds: World[], documentId: string | null): DocumentLocation | null {
  if (!documentId) return null;

  for (const world of worlds) {
    for (const story of world.stories) {
      const document = story.documents.find((entry) => entry.id === documentId);
      if (document) {
        return { world, story, document };
      }
    }
  }

  return null;
}

function deriveNavigationState(state: NavigationState): NavigationState {
  const worlds = normalizeWorlds(state.worlds);
  const currentWorld = findWorld(worlds, state.currentWorldId) ?? worlds[0] ?? null;
  const currentStory =
    currentWorld?.stories.find((story) => story.id === state.currentStoryId) ??
    currentWorld?.stories[0] ??
    null;
  const currentDocument =
    currentStory?.documents.find((document) => document.id === state.currentDocumentId) ??
    currentStory?.documents[0] ??
    null;

  const selectedDocumentId =
    state.selectedDocumentId &&
    currentStory?.documents.some((document) => document.id === state.selectedDocumentId)
      ? state.selectedDocumentId
      : null;

  return {
    ...state,
    worlds,
    currentWorldId: currentWorld?.id ?? null,
    currentStoryId: currentStory?.id ?? null,
    currentDocumentId: currentDocument?.id ?? null,
    selectedDocumentId,
  };
}

function mapWorld(
  state: NavigationState,
  worldId: string,
  updater: (world: World) => World,
): NavigationState {
  return {
    ...state,
    worlds: state.worlds.map((world) => (world.id === worldId ? updater(world) : world)),
  };
}

function mapStory(
  state: NavigationState,
  storyId: string,
  updater: (story: Story) => Story,
): NavigationState {
  return {
    ...state,
    worlds: state.worlds.map((world) => ({
      ...world,
      stories: world.stories.map((story) => (story.id === storyId ? updater(story) : story)),
    })),
  };
}

function mapDocument(
  state: NavigationState,
  documentId: string,
  updater: (document: Document) => Document,
): NavigationState {
  return {
    ...state,
    worlds: state.worlds.map((world) => ({
      ...world,
      stories: world.stories.map((story) => ({
        ...story,
        documents: story.documents.map((document) =>
          document.id === documentId ? updater(document) : document,
        ),
      })),
    })),
  };
}

function updateNavigationState(updater: (state: NavigationState) => NavigationState): void {
  navigationStore.setState((state) => deriveNavigationState(updater(state)));
}

function createInitialNavigationState(): NavigationState {
  return deriveNavigationState({
    currentView: ViewMode.editor,
    currentWorldId: null,
    currentStoryId: null,
    currentDocumentId: null,
    worlds: [],
    selectedDocumentId: null,
  });
}

const navigationStore = new Store<NavigationState>(createInitialNavigationState());

const navigationActions: NavigationActions = {
  setView: (view) => {
    updateNavigationState((state) => ({ ...state, currentView: view }));
  },

  navigateUp: () => {
    updateNavigationState((state) => {
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
    updateNavigationState((state) => ({
      ...state,
      currentView: ViewMode.editor,
      currentWorldId: worldId,
      currentStoryId: storyId,
      currentDocumentId: documentId,
      selectedDocumentId: documentId,
    }));
  },

  navigateToStory: (storyId, worldId) => {
    updateNavigationState((state) => ({
      ...state,
      currentView: ViewMode.storyView,
      currentWorldId: worldId,
      currentStoryId: storyId,
      selectedDocumentId: null,
    }));

    if (!findStory(navigationStore.state.worlds, storyId)) {
      void navigationActions.loadStory(storyId);
    }
  },

  navigateToWorld: (worldId) => {
    updateNavigationState((state) => ({
      ...state,
      currentView: ViewMode.worldView,
      currentWorldId: worldId,
      selectedDocumentId: null,
    }));

    if (!IS_DEVELOPMENT && !findWorld(navigationStore.state.worlds, worldId)) {
      void navigationActions.loadWorld(worldId);
    }
  },

  navigateToLegacy: () => {
    updateNavigationState((state) => ({
      ...state,
      currentView: ViewMode.legacy,
      selectedDocumentId: null,
    }));

    if (!IS_DEVELOPMENT && navigationStore.state.worlds.length === 0) {
      void navigationActions.loadLegacy();
    }
  },

  selectDocument: (id) => {
    updateNavigationState((state) => ({ ...state, selectedDocumentId: id }));
  },

  loadStory: async (storyId) => {
    try {
      const storyResponse = await queryApi<StoryResponse>(apiRoutes.story.fetchStory(storyId));
      const story = mapStoryState(storyResponse);

      updateNavigationState((state) => ({
        ...state,
        worlds: state.worlds.map((world) =>
          world.id === story.worldId
            ? {
                ...world,
                stories: [story, ...world.stories.filter((entry) => entry.id !== story.id)],
              }
            : world,
        ),
        currentView: ViewMode.storyView,
        currentWorldId: story.worldId,
        currentStoryId: story.id,
      }));
    } catch (error) {
      console.error('Failed to load story:', error);
    }
  },

  loadWorld: async (worldId) => {
    if (IS_DEVELOPMENT) {
      updateNavigationState((state) => ({
        ...state,
        currentView: ViewMode.worldView,
        currentWorldId: worldId,
      }));
      return;
    }

    try {
      const worldResponse = await queryApi<WorldResponse>(apiRoutes.story.fetchWorld(worldId));
      const world = mapWorldState(worldResponse);

      updateNavigationState((state) => ({
        ...state,
        worlds: [world, ...state.worlds.filter((entry) => entry.id !== world.id)],
        currentView: ViewMode.worldView,
        currentWorldId: world.id,
      }));
    } catch (error) {
      console.error('Failed to load world:', error);
    }
  },

  loadLegacy: async () => {
    if (IS_DEVELOPMENT) {
      updateNavigationState((state) => ({ ...state, currentView: ViewMode.legacy }));
      return;
    }

    try {
      const legacyResponse = await queryApi<WorldResponse[]>(apiRoutes.story.fetchLegacy());
      const worlds = legacyResponse.map(mapWorldState);
      updateNavigationState((state) => ({
        ...state,
        worlds,
        currentView: ViewMode.legacy,
      }));
    } catch (error) {
      console.error('Failed to load legacy:', error);
    }
  },

  createWorld: (userId: string) => {
    const title = generateTitle(
      navigationStore.state.worlds.map((world) => world.title),
      'Untitled World',
    );
    const createdWorld: World = {
      id: createId('world'),
      stories: [],
      title,
      userId,
    };

    updateNavigationState((state) => ({
      ...state,
      worlds: [createdWorld, ...state.worlds],
      currentWorldId: createdWorld.id,
    }));

    return { id: createdWorld.id, title: createdWorld.title };
  },

  renameWorld: (worldId, title) => {
    updateNavigationState((state) => mapWorld(state, worldId, (world) => ({ ...world, title })));
  },

  deleteWorld: (worldId) => {
    updateNavigationState((state) => ({
      ...state,
      worlds: state.worlds.filter((world) => world.id !== worldId),
      currentView: state.currentWorldId === worldId ? ViewMode.legacy : state.currentView,
    }));
  },

  updateWorldCover: (worldId, coverImage) => {
    updateNavigationState((state) =>
      mapWorld(state, worldId, (world) => ({ ...world, coverImage })),
    );
  },

  createStory: (worldId) => {
    const world = findWorld(navigationStore.state.worlds, worldId);
    if (!world) return null;

    const title = generateTitle(
      world.stories.map((story) => story.title),
      'Untitled Story',
    );
    const createdStory: Story = {
      id: createId('story'),
      title,
      worldId,
      documents: [],
      predecessorId: !world.stories.length
        ? null
        : (world.stories[world.stories.length - 1]?.id ?? null),
      successorId: null,
    };

    updateNavigationState((state) => ({
      ...mapWorld(state, worldId, (world) => ({
        ...world,
        stories: [createdStory, ...world.stories],
      })),
      currentWorldId: worldId,
      currentStoryId: createdStory.id,
    }));

    return { id: createdStory.id, title: createdStory.title };
  },

  renameStory: (storyId, title) => {
    updateNavigationState((state) => mapStory(state, storyId, (story) => ({ ...story, title })));
  },

  deleteStory: (storyId) => {
    updateNavigationState((state) => ({
      ...state,
      worlds: state.worlds.map((world) => ({
        ...world,
        stories: world.stories.filter((story) => story.id !== storyId),
      })),
      currentView:
        state.currentStoryId === storyId && state.currentView === ViewMode.storyView
          ? ViewMode.worldView
          : state.currentView,
    }));
  },

  moveStoryToWorld: (storyId, targetWorldId) => {
    updateNavigationState((state) => {
      const storyLocation = findStory(state.worlds, storyId);
      if (!storyLocation || storyLocation.world.id === targetWorldId) {
        return state;
      }

      const movedStory: Story = {
        ...storyLocation.story,
        worldId: targetWorldId,
      };

      return {
        ...state,
        worlds: state.worlds.map((world) => {
          if (world.id === storyLocation.world.id) {
            return {
              ...world,
              stories: world.stories.filter((story) => story.id !== storyId),
            };
          }

          if (world.id === targetWorldId) {
            return {
              ...world,
              stories: [movedStory, ...world.stories],
            };
          }

          return world;
        }),
        currentWorldId: state.currentStoryId === storyId ? targetWorldId : state.currentWorldId,
      };
    });
  },

  updateStory: (storyId, updatingStory) => {
    updateNavigationState((state) =>
      mapStory(state, storyId, (story) => ({ ...story, ...updatingStory })),
    );
  },

  createDocument: (storyId) => {
    const storyLocation = findStory(navigationStore.state.worlds, storyId);
    if (!storyLocation) return null;

    const title = generateTitle(
      storyLocation.story.documents.map((document) => document.title),
      'Untitled Document',
    );
    const createdDocument: Document = {
      id: createId('document'),
      title: title,
      body: '',
      storyId,
      predecessorId: null,
      successorId: null,
    };

    updateNavigationState((state) => ({
      ...mapStory(state, storyId, (story) => ({
        ...story,
        documents: [createdDocument, ...story.documents],
      })),
      currentWorldId: storyLocation.world.id,
      currentStoryId: storyId,
      currentDocumentId: createdDocument.id,
      selectedDocumentId: createdDocument.id,
    }));

    return { id: createdDocument.id, title: createdDocument.title };
  },

  deleteDocument: (documentId) => {
    updateNavigationState((state) => ({
      ...state,
      worlds: state.worlds.map((world) => ({
        ...world,
        stories: world.stories.map((story) => ({
          ...story,
          documents: story.documents.filter((document) => document.id !== documentId),
        })),
      })),
      currentView:
        state.currentDocumentId === documentId && state.currentView === 'editor'
          ? ViewMode.storyView
          : state.currentView,
    }));
  },

  moveDocumentToStory: (documentId, targetStoryId) => {
    updateNavigationState((state) => {
      const document = findDocument(state.worlds, documentId);
      const targetStory = findStory(state.worlds, targetStoryId);
      if (!document || !targetStory || document.story.id === targetStoryId) {
        return state;
      }

      const movedDocument: Document = {
        ...document.document,
        storyId: targetStoryId,
      };

      return {
        ...state,
        worlds: state.worlds.map((world) => ({
          ...world,
          stories: world.stories.map((story) => {
            // On previous story where the document existed, remove the document
            if (story.id === document.story.id) {
              return {
                ...story,
                documents: story.documents.filter(
                  (storyDocument) => storyDocument.id !== documentId,
                ),
              };
            }
            // On the new target story, add the document
            if (story.id === targetStoryId) {
              return {
                ...story,
                documents: [movedDocument, ...story.documents],
              };
            }
            // Story is not being changed targeted for adding or removing document
            return story;
          }),
        })),
      };
    });
  },

  moveDocumentPosition: (documentId, position) => {
    updateNavigationState((state) => {
      const documentLocation = findDocument(state.worlds, documentId);
      if (!documentLocation) {
        return state;
      }

      const documents = documentLocation.story.documents;
      const fromIndex = documents.findIndex((document) => document.id === documentId);
      if (fromIndex < 0) {
        return state;
      }

      let toIndex = fromIndex;

      switch (position) {
        case 'first':
          toIndex = 0;
          break;
        case 'earlier':
          toIndex = Math.max(0, fromIndex - 1);
          break;
        case 'later':
          toIndex = Math.min(documents.length - 1, fromIndex + 1);
          break;
        case 'last':
          toIndex = documents.length - 1;
          break;
      }

      if (toIndex === fromIndex) {
        return state;
      }

      const reorderedDocuments = moveItem(documents, fromIndex, toIndex);

      return mapStory(state, documentLocation.story.id, (story) => ({
        ...story,
        documents: reorderedDocuments,
      }));
    });
  },

  updateDocument: (documentId, updates) => {
    updateNavigationState((state) =>
      mapDocument(state, documentId, (document) => ({ ...document, ...updates })),
    );
  },
};

type NavigationStore = NavigationState &
  NavigationActions & {
    currentWorld: World | null;
    currentStory: Story | null;
  };

export function syncDocumentInNavigationStore(
  documentId: string,
  updates: Pick<Document, 'title' | 'body'>,
): void {
  navigationActions.updateDocument(documentId, updates);
}

export function useNavigationStore(): NavigationStore {
  const state = useStore(navigationStore, (currentState) => currentState);

  return useMemo(
    () => ({
      ...state,
      currentWorld: findWorld(state.worlds, state.currentWorldId),
      currentStory: findStory(state.worlds, state.currentStoryId)?.story ?? null,
      ...navigationActions,
    }),
    [state],
  );
}
