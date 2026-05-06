import { CannonNotFoundError } from '#constants/error/custom-errors';
import { UpsertCannonBody } from '#schemas/story.schemas';
import { CannonResponse } from '#types/shared/response';
import pool from '#config/database';
import { DocumentRowWithBody, StoryRow, StoryRowWithDocuments, CannonRow } from '#types/database';
import { mapCannonResponse } from '#utils/story/map-story';
import { decompressBody } from '#utils/compression';

export const deleteCannon = async (userId: string, cannonId: string): Promise<void> => {
  const result = await pool.query('DELETE FROM cannons WHERE cannon_id = $1 AND user_id = $2', [
    cannonId,
    userId,
  ]);
  if (result.rowCount === 0) {
    throw new CannonNotFoundError();
  }
};

export const upsertCannon = async (
  userId: string,
  data: UpsertCannonBody,
  fetchCannonResponse = fetchCannon,
): Promise<CannonResponse | null> => {
  const { cannonId, title } = data;

  if (cannonId) {
    const existing = await pool.query('SELECT 1 FROM cannons WHERE cannon_id = $1 AND user_id = $2', [
      cannonId,
      userId,
    ]);
    if (existing.rows.length === 0) {
      throw new CannonNotFoundError();
    }
    await pool.query('UPDATE cannons SET title = $1, updated_at = NOW() WHERE cannon_id = $2', [
      title,
      cannonId,
    ]);
    return fetchCannonResponse(cannonId);
  } else {
    const newCannon = await pool.query<CannonRow>(
      'INSERT INTO cannons (user_id, title) VALUES ($1, $2) RETURNING cannon_id',
      [userId, title],
    );
    return fetchCannonResponse(newCannon.rows[0].cannon_id);
  }
};

/**
 * Fetches a single cannon with all nested stories and documents.
 */
export const fetchCannon = async (cannonId: string): Promise<CannonResponse> => {
  return fetchCannonById(cannonId);
};

export const fetchUserCannon = async (userId: string, cannonId: string): Promise<CannonResponse> => {
  return fetchCannonById(cannonId, userId);
};

async function fetchCannonById(cannonId: string, userId?: string): Promise<CannonResponse> {
  const cannonResult = await pool.query<CannonRow>(
    `SELECT * FROM cannons
     WHERE cannon_id = $1${userId ? ' AND user_id = $2' : ''}`,
    userId ? [cannonId, userId] : [cannonId],
  );

  if (cannonResult.rows.length === 0) {
    throw new CannonNotFoundError();
  }

  const cannon = cannonResult.rows[0];

  const storiesResult = await pool.query<StoryRow>(
    'SELECT * FROM stories WHERE cannon_id = $1 ORDER BY created_at',
    [cannonId],
  );

  const storyIds = storiesResult.rows.map((s) => s.story_id);

  let documentRows: DocumentRowWithBody[] = [];
  if (storyIds.length > 0) {
    const docsResult = await pool.query<DocumentRowWithBody>(
      `SELECT d.*, dc.body FROM documents d
       LEFT JOIN document_content dc ON dc.document_id = d.document_id
       WHERE d.story_id = ANY($1) ORDER BY d.created_at`,
      [storyIds],
    );
    documentRows = docsResult.rows;
  }

  const decompressedDocs = await Promise.all(
    documentRows.map(async (doc) => ({
      ...doc,
      body: doc.body ? await decompressBody(doc.body) : '',
    })),
  );

  const docsByStory = new Map<string, StoryRowWithDocuments['documents']>();
  for (const doc of decompressedDocs) {
    const arr = docsByStory.get(doc.story_id) ?? [];
    arr.push(doc);
    docsByStory.set(doc.story_id, arr);
  }

  const stories: StoryRowWithDocuments[] = storiesResult.rows.map((story) => ({
    ...story,
    documents: docsByStory.get(story.story_id) ?? [],
  }));

  return mapCannonResponse(cannon, stories);
}

/**
 * Fetches all cannons (with nested stories and documents) for a user.
 * This is the user's "Legacy."
 */
export async function fetchLegacy(userId: string): Promise<CannonResponse[]> {
  const cannonsResult = await pool.query<CannonRow>(
    'SELECT * FROM cannons WHERE user_id = $1 ORDER BY created_at',
    [userId],
  );

  if (cannonsResult.rows.length === 0) return [];
  const cannonIds = cannonsResult.rows.map((w: CannonRow) => w.cannon_id);

  const storiesResult = await pool.query<StoryRow>(
    'SELECT * FROM stories WHERE cannon_id = ANY($1) ORDER BY created_at',
    [cannonIds],
  );

  const storyIds = storiesResult.rows.map((s) => s.story_id);

  let documentRows: DocumentRowWithBody[] = [];
  if (storyIds.length > 0) {
    const docsResult = await pool.query<DocumentRowWithBody>(
      `SELECT d.*, dc.body FROM documents d
       LEFT JOIN document_content dc ON dc.document_id = d.document_id
       WHERE d.story_id = ANY($1) ORDER BY d.created_at`,
      [storyIds],
    );
    documentRows = docsResult.rows;
  }

  const decompressedDocs = await Promise.all(
    documentRows.map(async (doc) => ({
      ...doc,
      body: doc.body ? await decompressBody(doc.body) : '',
    })),
  );

  const docsByStory = new Map<string, StoryRowWithDocuments['documents']>();
  for (const doc of decompressedDocs) {
    const arr = docsByStory.get(doc.story_id) ?? [];
    arr.push(doc);
    docsByStory.set(doc.story_id, arr);
  }

  const storiesByCannon = new Map<string, StoryRowWithDocuments[]>();
  for (const story of storiesResult.rows) {
    const arr: StoryRowWithDocuments[] = (storiesByCannon.get(story.cannon_id) ??
      []) as StoryRowWithDocuments[];
    arr.push({ ...story, documents: docsByStory.get(story.story_id) ?? [] });
    storiesByCannon.set(story.cannon_id, arr);
  }

  return cannonsResult.rows.map((cannon) =>
    mapCannonResponse(cannon, storiesByCannon.get(cannon.cannon_id) ?? []),
  );
}
