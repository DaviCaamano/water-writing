import type { UpsertStoryBody } from '#schemas/story.schemas';
import { withTransaction } from '#utils/database/with-transaction';
import { DocumentRowWithBody, StoryRowWithDocuments, Queryable } from '#types/database';
import { StoryNotFoundError, CannonNotFoundError } from '#constants/error/custom-errors';
import { StoryResponse } from '#types/shared/response';
import { fetchDocumentsForStories } from '#utils/story/fetch-documents';
import { decompressBody } from '#utils/compression';
import pool from '#config/database';
import { assertFound } from '#utils/database/assert-found';
import * as storyRepo from '#repositories/story.repository';
import * as cannonRepo from '#repositories/cannon.repository';
import * as documentRepo from '#repositories/document.repository';
import * as genreRepo from '#repositories/genre.repository';
import { mapStoryResponse } from '#utils/database/to-json-camel-case';

export const fetchStory = async (storyId: string): Promise<StoryRowWithDocuments> => {
  const result = await storyRepo.findById(pool, storyId);
  return assertFound(result, StoryNotFoundError) as StoryRowWithDocuments;
};

const decompressDocumentRows = async (
  rows: DocumentRowWithBody[],
): Promise<StoryRowWithDocuments['documents']> =>
  Promise.all(
    rows.map(async (doc) => ({
      ...doc,
      body: doc.body ? await decompressBody(doc.body) : '',
    })),
  );

export const fetchStoryWithDocuments = async (storyId: string): Promise<StoryRowWithDocuments> => {
  const story = assertFound(await storyRepo.findById(pool, storyId), StoryNotFoundError);
  const docsResult = await documentRepo.findByStoryId(pool, storyId);
  return {
    ...story,
    documents: await decompressDocumentRows(docsResult.rows),
  };
};

export const fetchUserStoryWithDocuments = async (
  userId: string,
  storyId: string,
): Promise<StoryRowWithDocuments> => {
  const story = assertFound(
    await storyRepo.findByIdWithUser(pool, storyId, userId),
    StoryNotFoundError,
  );
  const docsResult = await documentRepo.findByStoryId(pool, storyId);
  return {
    ...story,
    documents: await decompressDocumentRows(docsResult.rows),
  };
};

const updateExistingStory = async (
  client: Queryable,
  userId: string,
  storyId: string,
  title: string | undefined,
  cannonId: string | undefined,
): Promise<string> => {
  const existing = assertFound(
    await storyRepo.findByIdWithUserOwnership(client, storyId, userId),
    StoryNotFoundError,
  );

  if (title && title !== existing.title) {
    await storyRepo.updateTitle(client, storyId, title);
  }

  if (cannonId && cannonId !== existing.cannon_id) {
    assertFound(await cannonRepo.exists(client, cannonId, userId), CannonNotFoundError);
    await storyRepo.updateCannonId(client, storyId, cannonId);
  }

  return storyId;
};

const createNewStory = async (
  client: Queryable,
  userId: string,
  title: string | undefined,
  cannonId: string | undefined,
): Promise<string> => {
  let resolvedCannonId = cannonId;

  if (resolvedCannonId) {
    assertFound(await cannonRepo.exists(client, resolvedCannonId, userId), CannonNotFoundError);
  } else {
    const newCannon = await cannonRepo.insert(client, userId, 'Untitled Cannon');
    resolvedCannonId = newCannon.rows[0]!.cannon_id;
  }

  const newStory = await storyRepo.insert(client, resolvedCannonId!, title ?? null);
  return newStory.rows[0]!.story_id;
};

export const upsertStory = async (userId: string, data: UpsertStoryBody): Promise<StoryResponse> => {
  const { storyId, title, cannonId } = data;

  const persistedStoryId = await withTransaction(async (client) => {
    if (storyId) {
      return updateExistingStory(client, userId, storyId, title, cannonId);
    }
    return createNewStory(client, userId, title, cannonId);
  });

  return mapStoryResponse(await fetchStoryWithDocuments(persistedStoryId));
};

export const deleteStory = async (userId: string, storyId: string): Promise<void> => {
  const result = await storyRepo.deleteByIdAndUser(pool, storyId, userId);
  if (result.rowCount === 0) {
    throw new StoryNotFoundError();
  }
};

export const fetchUserStories = async (userId: string): Promise<StoryResponse[]> => {
  const storiesResult = await storyRepo.findByUserId(pool, userId);

  if (storiesResult.rows.length === 0) return [];

  const storyIds = storiesResult.rows.map((s) => s.story_id);
  const docsByStory = await fetchDocumentsForStories(storyIds);

  return storiesResult.rows.map((story) =>
    mapStoryResponse(story, docsByStory.get(story.story_id) ?? []),
  );
};

export const upsertGenre = async (userId: string, storyId: string, genres: string[]) => {
  assertFound(await storyRepo.userOwnsStory(pool, storyId, userId), StoryNotFoundError);

  for (const genre of genres) {
    await genreRepo.insertGenre(pool, storyId, genre);
  }

  const result = await genreRepo.findByStoryId(pool, storyId);
  return result.rows.map((r) => r.genre as string);
};
