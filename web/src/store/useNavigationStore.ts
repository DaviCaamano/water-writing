import { useMemo } from 'react';
import { Store, useStore } from '@tanstack/react-store';
import { api } from '@/lib/api';
import {
  createMockLegacyWorlds,
  mapLegacyStory,
  mapLegacyWorld,
  mapLegacyWorlds,
  type LegacyStoryResponse,
  type LegacyWorldResponse,
} from '@/lib/legacy-data';
import type { Story, StoryDocument, ViewMode, World } from '@/types';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

type DocumentMovePosition = 'first' | 'earlier' | 'later' | 'last';

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

interface CreatedItem {
  id: string;
  name: string;
}

interface StoryLocation {
  world: World;
  story: Story;
}

interface DocumentLocation {
  world: World;
  story: Story;
  document: StoryDocument;
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
  createWorld: () => CreatedItem;
  renameWorld: (worldId: string, name: string) => void;
  deleteWorld: (worldId: string) => void;
  updateWorldCover: (worldId: string, coverImage: string) => void;
  createStory: (worldId: string) => CreatedItem | null;
  renameStory: (storyId: string, name: string) => void;
  deleteStory: (storyId: string) => void;
  moveStoryToWorld: (storyId: string, targetWorldId: string) => void;
  updateStoryCover: (storyId: string, coverImage: string) => void;
  createDocument: (storyId: string) => CreatedItem | null;
  renameDocument: (documentId: string, title: string) => void;
  deleteDocument: (documentId: string) => void;
  moveDocumentToStory: (documentId: string, targetStoryId: string) => void;
  moveDocumentPosition: (documentId: string, position: DocumentMovePosition) => void;
  updateDocumentCover: (documentId: string, coverImage: string) => void;
  updateDocumentContent: (
    documentId: string,
    updates: Pick<StoryDocument, 'title' | 'body'>,
  ) => void;
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createUntitledName(existingNames: string[], baseName: string): string {
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

function normalizeDocuments(documents: StoryDocument[], storyId: string): StoryDocument[] {
  return documents.map((document, index) => ({
    ...document,
    storyId,
    predecessorId: index > 0 ? documents[index - 1].id : null,
    successorId: index < documents.length - 1 ? documents[index + 1].id : null,
    characters: document.characters ?? [],
    places: document.places ?? [],
    coverImage: document.coverImage ?? null,
  }));
}

function normalizeStory(story: Story): Story {
  const documents = normalizeDocuments(story.documents, story.id);

  return {
    ...story,
    documents,
    documentCount: documents.length,
    coverImage: story.coverImage ?? null,
  };
}

function normalizeWorld(world: World): World {
  return {
    ...world,
    coverImage: world.coverImage ?? null,
    stories: world.stories.map((story) =>
      normalizeStory({
        ...story,
        worldId: world.id,
      }),
    ),
  };
}

function normalizeWorlds(worlds: World[]): World[] {
  return worlds.map(normalizeWorld);
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

function getFirstWorld(worlds: World[]): World | null {
  return worlds[0] ?? null;
}

function getFirstStory(world: World | null): Story | null {
  return world?.stories[0] ?? null;
}

function getFirstDocument(story: Story | null): StoryDocument | null {
  return story?.documents[0] ?? null;
}

function deriveNavigationState(state: NavigationState): NavigationState {
  const worlds = normalizeWorlds(state.worlds);
  const explicitWorld = findWorld(worlds, state.currentWorldId);
  const explicitStory = findStory(worlds, state.currentStoryId);
  const explicitDocument = findDocument(worlds, state.currentDocumentId);

  const currentWorld =
    explicitWorld ??
    explicitStory?.world ??
    explicitDocument?.world ??
    getFirstWorld(worlds);
  const explicitStoryInCurrentWorld =
    explicitStory && explicitStory.world.id === currentWorld?.id ? explicitStory.story : null;
  const explicitDocumentStoryInCurrentWorld =
    explicitDocument && explicitDocument.world.id === currentWorld?.id
      ? explicitDocument.story
      : null;
  const matchingStory =
    currentWorld?.stories.find((story) => story.id === state.currentStoryId) ?? null;

  const currentStory =
    matchingStory ??
    explicitStoryInCurrentWorld ??
    explicitDocumentStoryInCurrentWorld ??
    getFirstStory(currentWorld);
  const matchingDocument =
    currentStory?.documents.find((document) => document.id === state.currentDocumentId) ?? null;

  const currentDocument = matchingDocument ?? getFirstDocument(currentStory);

  const selectedDocumentId =
    state.selectedDocumentId &&
    currentStory?.documents.some((document) => document.id === state.selectedDocumentId)
      ? state.selectedDocumentId
      : null;

  return {
    ...state,
    worlds,
    currentWorldId: currentWorld?.id ?? null,
    currentWorld,
    currentStoryId: currentStory?.id ?? null,
    currentStory,
    currentDocumentId: currentDocument?.id ?? null,
    selectedDocumentId,
  };
}

function updateNavigationState(updater: (state: NavigationState) => NavigationState): void {
  navigationStore.setState((state) => deriveNavigationState(updater(state)));
}

function createInitialNavigationState(): NavigationState {
  const worlds = IS_DEVELOPMENT ? createMockLegacyWorlds() : [];
  const initialWorld = getFirstWorld(worlds);
  const initialStory = getFirstStory(initialWorld);
  const initialDocument = getFirstDocument(initialStory);

  return deriveNavigationState({
    currentView: 'editor',
    currentWorldId: initialWorld?.id ?? null,
    currentStoryId: initialStory?.id ?? null,
    currentDocumentId: initialDocument?.id ?? null,
    worlds,
    currentStory: initialStory ?? null,
    currentWorld: initialWorld ?? null,
    selectedDocumentId: initialDocument?.id ?? null,
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
        case 'editor':
          return { ...state, currentView: 'story-view' };
        case 'story-view':
          return { ...state, currentView: 'world-view' };
        case 'world-view':
          return { ...state, currentView: 'legacy' };
        default:
          return state;
      }
    });
  },

  navigateToEditor: (documentId, storyId, worldId) => {
    updateNavigationState((state) => ({
      ...state,
      currentView: 'editor',
      currentWorldId: worldId,
      currentStoryId: storyId,
      currentDocumentId: documentId,
      selectedDocumentId: documentId,
    }));
  },

  navigateToStory: (storyId, worldId) => {
    updateNavigationState((state) => ({
      ...state,
      currentView: 'story-view',
      currentWorldId: worldId,
      currentStoryId: storyId,
      selectedDocumentId: null,
    }));

    if (!IS_DEVELOPMENT && !navigationStore.state.currentStory) {
      void navigationActions.loadStory(storyId);
    }
  },

  navigateToWorld: (worldId) => {
    updateNavigationState((state) => ({
      ...state,
      currentView: 'world-view',
      currentWorldId: worldId,
      selectedDocumentId: null,
    }));

    if (!IS_DEVELOPMENT && !navigationStore.state.currentWorld) {
      void navigationActions.loadWorld(worldId);
    }
  },

  navigateToLegacy: () => {
    updateNavigationState((state) => ({ ...state, currentView: 'legacy', selectedDocumentId: null }));

    if (!IS_DEVELOPMENT && navigationStore.state.worlds.length === 0) {
      void navigationActions.loadLegacy();
    }
  },

  selectDocument: (id) => {
    updateNavigationState((state) => ({ ...state, selectedDocumentId: id }));
  },

  loadStory: async (storyId) => {
    if (IS_DEVELOPMENT) {
      const storyLocation = findStory(navigationStore.state.worlds, storyId);
      if (!storyLocation) return;

      updateNavigationState((state) => ({
        ...state,
        currentView: 'story-view',
        currentWorldId: storyLocation.world.id,
        currentStoryId: storyLocation.story.id,
      }));
      return;
    }

    try {
      const storyResponse = await api<LegacyStoryResponse>(`/story/${storyId}`);
      const story = mapLegacyStory(storyResponse);

      updateNavigationState((state) => ({
        ...state,
        worlds: state.worlds.map((world) =>
          world.id === story.worldId
            ? {
                ...world,
                stories: [
                  story,
                  ...world.stories.filter((entry) => entry.id !== story.id),
                ],
              }
            : world,
        ),
        currentView: 'story-view',
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
        currentView: 'world-view',
        currentWorldId: worldId,
      }));
      return;
    }

    try {
      const worldResponse = await api<LegacyWorldResponse>(`/world/${worldId}`);
      const world = mapLegacyWorld(worldResponse);

      updateNavigationState((state) => ({
        ...state,
        worlds: [world, ...state.worlds.filter((entry) => entry.id !== world.id)],
        currentView: 'world-view',
        currentWorldId: world.id,
      }));
    } catch (error) {
      console.error('Failed to load world:', error);
    }
  },

  loadLegacy: async () => {
    if (IS_DEVELOPMENT) {
      updateNavigationState((state) => ({ ...state, currentView: 'legacy' }));
      return;
    }

    try {
      const worlds = mapLegacyWorlds(await api<LegacyWorldResponse[]>('/worlds'));
      updateNavigationState((state) => ({
        ...state,
        worlds,
        currentView: 'legacy',
      }));
    } catch (error) {
      console.error('Failed to load legacy:', error);
    }
  },

  createWorld: () => {
    const name = createUntitledName(
      navigationStore.state.worlds.map((world) => world.name),
      'Untitled World',
    );
    const createdWorld: World = {
      id: createId('world'),
      name,
      stories: [],
      coverImage: null,
    };

    updateNavigationState((state) => ({
      ...state,
      worlds: [createdWorld, ...state.worlds],
      currentWorldId: createdWorld.id,
    }));

    return { id: createdWorld.id, name: createdWorld.name };
  },

  renameWorld: (worldId, name) => {
    updateNavigationState((state) => ({
      ...state,
      worlds: state.worlds.map((world) =>
        world.id === worldId
          ? {
              ...world,
              name,
            }
          : world,
      ),
    }));
  },

  deleteWorld: (worldId) => {
    updateNavigationState((state) => {
      const deletingCurrentWorld = state.currentWorldId === worldId;

      return {
        ...state,
        worlds: state.worlds.filter((world) => world.id !== worldId),
        currentView: deletingCurrentWorld ? 'legacy' : state.currentView,
        currentWorldId: deletingCurrentWorld ? null : state.currentWorldId,
        currentStoryId: deletingCurrentWorld ? null : state.currentStoryId,
        currentDocumentId: deletingCurrentWorld ? null : state.currentDocumentId,
        selectedDocumentId: deletingCurrentWorld ? null : state.selectedDocumentId,
      };
    });
  },

  updateWorldCover: (worldId, coverImage) => {
    updateNavigationState((state) => ({
      ...state,
      worlds: state.worlds.map((world) =>
        world.id === worldId
          ? {
              ...world,
              coverImage,
            }
          : world,
      ),
    }));
  },

  createStory: (worldId) => {
    const world = findWorld(navigationStore.state.worlds, worldId);
    if (!world) return null;

    const name = createUntitledName(world.stories.map((story) => story.name), 'Untitled Story');
    const createdStory: Story = {
      id: createId('story'),
      name,
      worldId,
      documentCount: 0,
      documents: [],
      coverImage: null,
    };

    updateNavigationState((state) => ({
      ...state,
      worlds: state.worlds.map((entry) =>
        entry.id === worldId
          ? {
              ...entry,
              stories: [createdStory, ...entry.stories],
            }
          : entry,
      ),
      currentWorldId: worldId,
      currentStoryId: createdStory.id,
    }));

    return { id: createdStory.id, name: createdStory.name };
  },

  renameStory: (storyId, name) => {
    updateNavigationState((state) => ({
      ...state,
      worlds: state.worlds.map((world) => ({
        ...world,
        stories: world.stories.map((story) =>
          story.id === storyId
            ? {
                ...story,
                name,
              }
            : story,
        ),
      })),
    }));
  },

  deleteStory: (storyId) => {
    updateNavigationState((state) => {
      const deletingCurrentStory = state.currentStoryId === storyId;

      return {
        ...state,
        worlds: state.worlds.map((world) => ({
          ...world,
          stories: world.stories.filter((story) => story.id !== storyId),
        })),
        currentView: deletingCurrentStory && state.currentView === 'story-view' ? 'world-view' : state.currentView,
        currentStoryId: deletingCurrentStory ? null : state.currentStoryId,
        currentDocumentId: deletingCurrentStory ? null : state.currentDocumentId,
        selectedDocumentId: deletingCurrentStory ? null : state.selectedDocumentId,
      };
    });
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

  updateStoryCover: (storyId, coverImage) => {
    updateNavigationState((state) => ({
      ...state,
      worlds: state.worlds.map((world) => ({
        ...world,
        stories: world.stories.map((story) =>
          story.id === storyId
            ? {
                ...story,
                coverImage,
              }
            : story,
        ),
      })),
    }));
  },

  createDocument: (storyId) => {
    const storyLocation = findStory(navigationStore.state.worlds, storyId);
    if (!storyLocation) return null;

    const name = createUntitledName(
      storyLocation.story.documents.map((document) => document.title),
      'Untitled Document',
    );
    const createdDocument: StoryDocument = {
      id: createId('document'),
      title: name,
      body: '',
      storyId,
      predecessorId: null,
      successorId: null,
      characters: [],
      places: [],
      coverImage: null,
    };

    updateNavigationState((state) => ({
      ...state,
      worlds: state.worlds.map((world) => ({
        ...world,
        stories: world.stories.map((story) =>
          story.id === storyId
            ? {
                ...story,
                documents: [createdDocument, ...story.documents],
              }
            : story,
        ),
      })),
      currentWorldId: storyLocation.world.id,
      currentStoryId: storyId,
      currentDocumentId: createdDocument.id,
      selectedDocumentId: createdDocument.id,
    }));

    return { id: createdDocument.id, name: createdDocument.title };
  },

  renameDocument: (documentId, title) => {
    updateNavigationState((state) => ({
      ...state,
      worlds: state.worlds.map((world) => ({
        ...world,
        stories: world.stories.map((story) => ({
          ...story,
          documents: story.documents.map((document) =>
            document.id === documentId
              ? {
                  ...document,
                  title,
                }
              : document,
          ),
        })),
      })),
    }));
  },

  deleteDocument: (documentId) => {
    updateNavigationState((state) => {
      const deletingCurrentDocument = state.currentDocumentId === documentId;

      return {
        ...state,
        worlds: state.worlds.map((world) => ({
          ...world,
          stories: world.stories.map((story) => ({
            ...story,
            documents: story.documents.filter((document) => document.id !== documentId),
          })),
        })),
        currentView:
          deletingCurrentDocument && state.currentView === 'editor' ? 'story-view' : state.currentView,
        currentDocumentId: deletingCurrentDocument ? null : state.currentDocumentId,
        selectedDocumentId:
          state.selectedDocumentId === documentId ? null : state.selectedDocumentId,
      };
    });
  },

  moveDocumentToStory: (documentId, targetStoryId) => {
    updateNavigationState((state) => {
      const documentLocation = findDocument(state.worlds, documentId);
      const targetStoryLocation = findStory(state.worlds, targetStoryId);
      if (!documentLocation || !targetStoryLocation || documentLocation.story.id === targetStoryId) {
        return state;
      }

      const movedDocument: StoryDocument = {
        ...documentLocation.document,
        storyId: targetStoryId,
      };

      return {
        ...state,
        worlds: state.worlds.map((world) => ({
          ...world,
          stories: world.stories.map((story) => {
            if (story.id === documentLocation.story.id) {
              return {
                ...story,
                documents: story.documents.filter((document) => document.id !== documentId),
              };
            }

            if (story.id === targetStoryId) {
              return {
                ...story,
                documents: [movedDocument, ...story.documents],
              };
            }

            return story;
          }),
        })),
        currentDocumentId: state.currentDocumentId === documentId ? null : state.currentDocumentId,
        selectedDocumentId:
          state.selectedDocumentId === documentId ? null : state.selectedDocumentId,
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

      return {
        ...state,
        worlds: state.worlds.map((world) => ({
          ...world,
          stories: world.stories.map((story) =>
            story.id === documentLocation.story.id
              ? {
                  ...story,
                  documents: reorderedDocuments,
                }
              : story,
          ),
        })),
      };
    });
  },

  updateDocumentCover: (documentId, coverImage) => {
    updateNavigationState((state) => ({
      ...state,
      worlds: state.worlds.map((world) => ({
        ...world,
        stories: world.stories.map((story) => ({
          ...story,
          documents: story.documents.map((document) =>
            document.id === documentId
              ? {
                  ...document,
                  coverImage,
                }
              : document,
          ),
        })),
      })),
    }));
  },

  updateDocumentContent: (documentId, updates) => {
    updateNavigationState((state) => ({
      ...state,
      worlds: state.worlds.map((world) => ({
        ...world,
        stories: world.stories.map((story) => ({
          ...story,
          documents: story.documents.map((document) =>
            document.id === documentId
              ? {
                  ...document,
                  ...updates,
                }
              : document,
          ),
        })),
      })),
    }));
  },
};

type NavigationStore = NavigationState & NavigationActions;

export function syncDocumentInNavigationStore(
  documentId: string,
  updates: Pick<StoryDocument, 'title' | 'body'>,
): void {
  navigationActions.updateDocumentContent(documentId, updates);
}

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
