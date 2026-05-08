import type { UpsertStoryBody } from '#schemas/story.schemas';
import { withTransaction } from '#utils/database/with-transaction';
import { DocumentRowWithBody, GenreRow, StoryRow, StoryRowWithDocuments } from '#types/database';
import { StoryNotFoundError, CannonNotFoundError } from '#constants/error/custom-errors';
import { StoryResponse } from '#types/shared/response';
import { mapStoryResponse } from '#utils/story/map-story';
import { fetchDocumentsForStories } from '#utils/story/fetch-documents';
import { decompressBody } from '#utils/compression';
import pool from '#config/database';

export const fetchStory = async (storyId: string): Promise<StoryRowWithDocuments> => {
  const result = await pool.query<StoryRowWithDocuments>(
    `SELECT *
      FROM stories s
      WHERE s.story_id = $1;`,
    [storyId],
  );
  if (result.rows.length === 0) {
    throw new StoryNotFoundError();
  }
  return result.rows[0];
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
  const storyResult = await pool.query<StoryRow>(
    'SELECT * FROM stories WHERE story_id = $1',
    [storyId],
  );
  if (storyResult.rows.length === 0) {
    throw new StoryNotFoundError();
  }
  const docsResult = await pool.query<DocumentRowWithBody>(
    `SELECT d.*, dc.body FROM documents d
     LEFT JOIN document_content dc ON dc.document_id = d.document_id
     WHERE d.story_id = $1 ORDER BY d.created_at`,
    [storyId],
  );
  return {
    ...storyResult.rows[0],
    documents: await decompressDocumentRows(docsResult.rows),
  };
};

export const fetchUserStoryWithDocuments = async (
  userId: string,
  storyId: string,
): Promise<StoryRowWithDocuments> => {
  const storyResult = await pool.query<StoryRow>(
    `SELECT s.* FROM stories s
     JOIN cannons w ON w.cannon_id = s.cannon_id
     WHERE s.story_id = $1 AND w.user_id = $2`,
    [storyId, userId],
  );
  if (storyResult.rows.length === 0) {
    throw new StoryNotFoundError();
  }
  const docsResult = await pool.query<DocumentRowWithBody>(
    `SELECT d.*, dc.body FROM documents d
     LEFT JOIN document_content dc ON dc.document_id = d.document_id
     WHERE d.story_id = $1 ORDER BY d.created_at`,
    [storyId],
  );
  return {
    ...storyResult.rows[0],
    documents: await decompressDocumentRows(docsResult.rows),
  };
};

async function updateExistingStory(
  client: { query: InstanceType<typeof import('pg').Pool>['query'] },
  userId: string,
  storyId: string,
  title: string | undefined,
  cannonId: string | undefined,
): Promise<string> {
  const existing = await client.query<StoryRow & { user_id: string }>(
    `SELECT s.*, w.user_id FROM stories s
     JOIN cannons w ON w.cannon_id = s.cannon_id
     WHERE s.story_id = $1 AND w.user_id = $2`,
    [storyId, userId],
  );

  if (existing.rows.length === 0) {
    throw new StoryNotFoundError();
  }

  if (title && title !== existing.rows[0].title) {
    await client.query(
      'UPDATE stories SET title = $1, updated_at = NOW() WHERE story_id = $2',
      [title, storyId],
    );
  }

  if (cannonId && cannonId !== existing.rows[0].cannon_id) {
    const targetCannon = await client.query(
      'SELECT 1 FROM cannons WHERE cannon_id = $1 AND user_id = $2',
      [cannonId, userId],
    );
    if (targetCannon.rows.length === 0) {
      throw new CannonNotFoundError();
    }
    await client.query(
      'UPDATE stories SET cannon_id = $1, updated_at = NOW() WHERE story_id = $2',
      [cannonId, storyId],
    );
  }

  return storyId;
}

async function createNewStory(
  client: { query: InstanceType<typeof import('pg').Pool>['query'] },
  userId: string,
  title: string | undefined,
  cannonId: string | undefined,
): Promise<string> {
  let resolvedCannonId = cannonId;

  if (resolvedCannonId) {
    const cannonCheck = await client.query(
      'SELECT 1 FROM cannons WHERE cannon_id = $1 AND user_id = $2',
      [resolvedCannonId, userId],
    );
    if (cannonCheck.rows.length === 0) {
      throw new CannonNotFoundError();
    }
  } else {
    const newCannon = await client.query(
      'INSERT INTO cannons (user_id, title) VALUES ($1, $2) RETURNING cannon_id',
      [userId, 'Untitled Cannon'],
    );
    resolvedCannonId = newCannon.rows[0].cannon_id;
  }

  const newStory = await client.query(
    'INSERT INTO stories (cannon_id, title) VALUES ($1, $2) RETURNING story_id',
    [resolvedCannonId, title],
  );
  return newStory.rows[0].story_id;
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
  const result = await pool.query(
    `DELETE FROM stories
     WHERE story_id = $1
       AND cannon_id IN (SELECT cannon_id FROM cannons WHERE user_id = $2)`,
    [storyId, userId],
  );
  if (result.rowCount === 0) {
    throw new StoryNotFoundError();
  }
}

export async function fetchUserStories(userId: string): Promise<StoryResponse[]> {
  const storiesResult = await pool.query<StoryRow>(
    `SELECT s.*
     FROM stories s
     JOIN cannons w ON w.cannon_id = s.cannon_id
     WHERE w.user_id = $1
     ORDER BY s.created_at`,
    [userId],
  );

  if (storiesResult.rows.length === 0) return [];

  const storyIds = storiesResult.rows.map((s) => s.story_id);
  const docsByStory = await fetchDocumentsForStories(storyIds);

  return storiesResult.rows.map((story) =>
    mapStoryResponse(story, docsByStory.get(story.story_id) ?? []),
  );
}

// Genres
export async function upsertGenre(userId: string, storyId: string, genres: string[]) {
  const storyResult = await pool.query(
    `SELECT 1
     FROM stories s
     JOIN cannons w ON w.cannon_id = s.cannon_id
     WHERE s.story_id = $1 AND w.user_id = $2`,
    [storyId, userId],
  );

  if (storyResult.rows.length === 0) {
    throw new StoryNotFoundError();
  }

  for (const genre of genres) {
    await pool.query(
      'INSERT INTO genres (story_id, genre) VALUES ($1, $2) ON CONFLICT (story_id, genre) DO NOTHING',
      [storyId, genre],
    );
  }

  const result = await pool.query<GenreRow>(
    'SELECT genre FROM genres WHERE story_id = $1 ORDER BY genre',
    [storyId],
  );
  return result.rows.map((r) => r.genre as string);
}
