import type { Story, StoryDocument, World } from '@/types';

export interface LegacyDocumentResponse {
  documentId: string;
  storyId: string;
  title: string;
  body: string;
  predecessorId: string | null;
  successorId: string | null;
}

export interface LegacyStoryResponse {
  storyId: string;
  worldId: string;
  title: string;
  predecessorId: string | null;
  successorId: string | null;
  documents: LegacyDocumentResponse[];
}

export interface LegacyWorldResponse {
  worldId: string;
  userId: string;
  title: string;
  stories: LegacyStoryResponse[];
}

export type DocumentMatrix = number[][];

const DEFAULT_DOCUMENT_MATRIX: DocumentMatrix = [
  [3, 5, 2, 4],
  [1, 0, 6],
  [2, 3, 1, 5],
  [4, 2],
];

function createDocumentResponses(
  storyId: string,
  worldIndex: number,
  storyIndex: number,
  documentCount: number,
): LegacyDocumentResponse[] {
  return Array.from({ length: documentCount }, (_, documentIndex) => ({
    documentId: `document-${worldIndex + 1}-${storyIndex + 1}-${documentIndex + 1}`,
    storyId,
    title: `Document ${worldIndex + 1}.${storyIndex + 1}.${documentIndex + 1}`,
    body:
      `This is a development-mode draft for Story ${worldIndex + 1}.${storyIndex + 1}. ` +
      `Use it to test renaming, cover uploads, and navigation into the editor.`,
    predecessorId:
      documentIndex > 0
        ? `document-${worldIndex + 1}-${storyIndex + 1}-${documentIndex}`
        : null,
    successorId:
      documentIndex < documentCount - 1
        ? `document-${worldIndex + 1}-${storyIndex + 1}-${documentIndex + 2}`
        : null,
  }));
}

function createStoryResponses(
  worldId: string,
  worldIndex: number,
  documentCounts: number[],
): LegacyStoryResponse[] {
  return documentCounts.map((documentCount, storyIndex) => {
    const storyId = `story-${worldIndex + 1}-${storyIndex + 1}`;

    return {
      storyId,
      worldId,
      title: `Story ${worldIndex + 1}.${storyIndex + 1}`,
      predecessorId: storyIndex > 0 ? `story-${worldIndex + 1}-${storyIndex}` : null,
      successorId:
        storyIndex < documentCounts.length - 1 ? `story-${worldIndex + 1}-${storyIndex + 2}` : null,
      documents: createDocumentResponses(storyId, worldIndex, storyIndex, documentCount),
    };
  });
}

// Ported from the API test helper so the web app can seed nested dev data locally.
export function mockLegacyResponse(
  documentMatrix: DocumentMatrix = DEFAULT_DOCUMENT_MATRIX,
): LegacyWorldResponse[] {
  return documentMatrix.map((documentCounts, worldIndex) => {
    const worldId = `world-${worldIndex + 1}`;

    return {
      worldId,
      userId: 'dev-user',
      title: `World ${worldIndex + 1}`,
      stories: createStoryResponses(worldId, worldIndex, documentCounts),
    };
  });
}

function mapDocumentResponse(document: LegacyDocumentResponse): StoryDocument {
  return {
    id: document.documentId,
    title: document.title,
    body: document.body,
    storyId: document.storyId,
    predecessorId: document.predecessorId,
    successorId: document.successorId,
    characters: [],
    places: [],
    coverImage: null,
  };
}

export function mapLegacyStory(story: LegacyStoryResponse): Story {
  const documents = story.documents.map(mapDocumentResponse);

  return {
    id: story.storyId,
    name: story.title,
    worldId: story.worldId,
    documentCount: documents.length,
    documents,
    coverImage: null,
  };
}

export function mapLegacyWorld(world: LegacyWorldResponse): World {
  return {
    id: world.worldId,
    name: world.title,
    stories: world.stories.map(mapLegacyStory),
    coverImage: null,
  };
}

export function mapLegacyWorlds(worlds: LegacyWorldResponse[]): World[] {
  return worlds.map(mapLegacyWorld);
}

export function createMockLegacyWorlds(documentMatrix?: DocumentMatrix): World[] {
  return mapLegacyWorlds(mockLegacyResponse(documentMatrix));
}
