import { CannonNotFoundError } from '#constants/error/custom-errors';
import { UpsertCannonBody } from '#schemas/story.schemas';
import { CannonResponse } from '#types/shared/response';
import pool from '#config/database';
import { StoryRow, StoryRowWithDocuments, CannonRow } from '#types/database';
import { mapCannonResponse } from '#utils/story/map-story';
import { fetchDocumentsForStories } from '#utils/story/fetch-documents';

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
  fetchCannonFn = fetchCannon,
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
    return fetchCannonFn(cannonId);
  } else {
    const newCannon = await pool.query<CannonRow>(
      'INSERT INTO cannons (user_id, title) VALUES ($1, $2) RETURNING cannon_id',
      [userId, title],
    );
    const created = newCannon.rows[0];
    if (!created) throw new CannonNotFoundError();
    return fetchCannonFn(created.cannon_id);
  }
};

export async function fetchCannon(cannonId: string, userId?: string): Promise<CannonResponse> {
  const cannonResult = await pool.query<CannonRow>(
    `SELECT * FROM cannons
     WHERE cannon_id = $1${userId ? ' AND user_id = $2' : ''}`,
    userId ? [cannonId, userId] : [cannonId],
  );

  if (cannonResult.rows.length === 0) {
    throw new CannonNotFoundError();
  }

  const cannon = cannonResult.rows[0]!;

  const storiesResult = await pool.query<StoryRow>(
    'SELECT * FROM stories WHERE cannon_id = $1 ORDER BY created_at',
    [cannonId],
  );

  const storyIds = storiesResult.rows.map((s) => s.story_id);
  const docsByStory = await fetchDocumentsForStories(storyIds);

  const stories: StoryRowWithDocuments[] = storiesResult.rows.map((story) => ({
    ...story,
    documents: docsByStory.get(story.story_id) ?? [],
  }));

  return mapCannonResponse(cannon, stories);
}

export const fetchUserCannon = (userId: string, cannonId: string): Promise<CannonResponse> =>
  fetchCannon(cannonId, userId);

export async function fetchLegacy(userId: string): Promise<CannonResponse[]> {
  const cannonsResult = await pool.query<CannonRow>(
    'SELECT * FROM cannons WHERE user_id = $1 ORDER BY created_at',
    [userId],
  );

  if (cannonsResult.rows.length === 0) return [];

  const storiesResult = await pool.query<StoryRow>(
    'SELECT * FROM stories WHERE cannon_id = ANY($1) ORDER BY created_at',
    [cannonsResult.rows.map((w) => w.cannon_id)],
  );

  const storyIds = storiesResult.rows.map((s) => s.story_id);
  const docsByStory = await fetchDocumentsForStories(storyIds);

  const storiesByCannon = new Map<string, StoryRowWithDocuments[]>();
  for (const story of storiesResult.rows) {
    const arr = storiesByCannon.get(story.cannon_id) ?? [];
    arr.push({ ...story, documents: docsByStory.get(story.story_id) ?? [] });
    storiesByCannon.set(story.cannon_id, arr);
  }

  return cannonsResult.rows.map((cannon) =>
    mapCannonResponse(cannon, storiesByCannon.get(cannon.cannon_id) ?? []),
  );
}
