import type { UpsertStoryBody } from '#schemas/story.schemas';
import { withTransaction } from '#utils/database/with-transaction';
import { DocumentRowWithBody, StoryRowWithDocuments, Queryable } from '#types/database';
import { StoryNotFoundError, CannonNotFoundError } from '#constants/error/custom-errors';
import { StoryResponse } from '#types/shared/response';
import { mapStoryResponse } from '#utils/story/map-story';
import { fetchDocumentsForStories } from '#utils/story/fetch-documents';
import { decompressBody } from '#utils/compression';
import pool from '#config/database';
import * as storyRepo from '#repositories/story.repository';
import * as cannonRepo from '#repositories/cannon.repository';
import * as documentRepo from '#repositories/document.repository';
import * as genreRepo from '#repositories/genre.repository';

export const fetchStory = async (storyId: string): Promise<StoryRowWithDocuments> => {
  const result = await storyRepo.findById(pool, storyId);
  if (result.rows.length === 0) {
    throw new StoryNotFoundError();
  }
  return result.rows[0]! as StoryRowWithDocuments;
};

async function decompressDocumentRows(rows: DocumentRowWithBody[]): Promise<StoryRowWithDocuments['documents']> {
  return Promise.all(
    rows.map(async (doc) => ({
      ...doc,
      body: doc.body ? await decompressBody(doc.body) : '',
    })),
  );
}

export const fetchStoryWithDocuments = async (storyId: string): Promise<StoryRowWithDocuments> => {
  const storyResult = await storyRepo.findById(pool, storyId);
  if (storyResult.rows.length === 0) {
    throw new StoryNotFoundError();
  }
  const docsResult = await documentRepo.findByStoryId(pool, storyId);
  return {
    ...storyResult.rows[0]!,
    documents: await decompressDocumentRows(docsResult.rows),
  };
};

export const fetchUserStoryWithDocuments = async (
  userId: string,
  storyId: string,
): Promise<StoryRowWithDocuments> => {
  const storyResult = await storyRepo.findByIdWithUser(pool, storyId, userId);
  if (storyResult.rows.length === 0) {
    throw new StoryNotFoundError();
  }
  const docsResult = await documentRepo.findByStoryId(pool, storyId);
  return {
    ...storyResult.rows[0]!,
    documents: await decompressDocumentRows(docsResult.rows),
  };
};

async function updateExistingStory(
  client: Queryable,
  userId: string,
  storyId: string,
  title: string | undefined,
  cannonId: string | undefined,
): Promise<string> {
  const existing = await storyRepo.findByIdWithUserOwnership(client, storyId, userId);

  if (existing.rows.length === 0) {
    throw new StoryNotFoundError();
  }

  if (title && title !== existing.rows[0]!.title) {
    await storyRepo.updateTitle(client, storyId, title);
  }

  if (cannonId && cannonId !== existing.rows[0]!.cannon_id) {
    const targetCannon = await cannonRepo.exists(client, cannonId, userId);
    if (targetCannon.rows.length === 0) {
      throw new CannonNotFoundError();
    }
    await storyRepo.updateCannonId(client, storyId, cannonId);
  }

  return storyId;
}

async function createNewStory(
  client: Queryable,
  userId: string,
  title: string | undefined,
  cannonId: string | undefined,
): Promise<string> {
  let resolvedCannonId = cannonId;

  if (resolvedCannonId) {
    const cannonCheck = await cannonRepo.exists(client, resolvedCannonId, userId);
    if (cannonCheck.rows.length === 0) {
      throw new CannonNotFoundError();
    }
  } else {
    const newCannon = await cannonRepo.insert(client, userId, 'Untitled Cannon');
    resolvedCannonId = newCannon.rows[0]!.cannon_id;
  }

  const newStory = await storyRepo.insert(client, resolvedCannonId!, title ?? null);
  return newStory.rows[0]!.story_id;
}

export async function upsertStory(userId: string, data: UpsertStoryBody): Promise<StoryResponse> {
  const { storyId, title, cannonId } = data;

  const persistedStoryId = await withTransaction(async (client) => {
    if (storyId) {
      return updateExistingStory(client, userId, storyId, title, cannonId);
    }
    return createNewStory(client, userId, title, cannonId);
  });

  return mapStoryResponse(await fetchStoryWithDocuments(persistedStoryId));
}

export async function deleteStory(userId: string, storyId: string): Promise<void> {
  const result = await storyRepo.deleteByIdAndUser(pool, storyId, userId);
  if (result.rowCount === 0) {
    throw new StoryNotFoundError();
  }
}

export async function fetchUserStories(userId: string): Promise<StoryResponse[]> {
  const storiesResult = await storyRepo.findByUserId(pool, userId);

  if (storiesResult.rows.length === 0) return [];

  const storyIds = storiesResult.rows.map((s) => s.story_id);
  const docsByStory = await fetchDocumentsForStories(storyIds);

  return storiesResult.rows.map((story) =>
    mapStoryResponse(story, docsByStory.get(story.story_id) ?? []),
  );
}

export async function upsertGenre(userId: string, storyId: string, genres: string[]) {
  const storyResult = await storyRepo.userOwnsStory(pool, storyId, userId);

  if (storyResult.rows.length === 0) {
    throw new StoryNotFoundError();
  }

  for (const genre of genres) {
    await genreRepo.insertGenre(pool, storyId, genre);
  }

  const result = await genreRepo.findByStoryId(pool, storyId);
  return result.rows.map((r) => r.genre as string);
}
