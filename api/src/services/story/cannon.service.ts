import { CannonNotFoundError } from '#constants/error/custom-errors';
import { UpsertCannonBody } from '#schemas/story.schemas';
import { CannonResponse } from '#types/shared/response';
import pool from '#config/database';
import { StoryRowWithDocuments } from '#types/database';
import { mapCannonResponse } from '#utils/story/map-story';
import { fetchDocumentsForStories } from '#utils/story/fetch-documents';
import { assertFound } from '#utils/database/assert-found';
import * as cannonRepo from '#repositories/cannon.repository';
import * as storyRepo from '#repositories/story.repository';

export const deleteCannon = async (userId: string, cannonId: string): Promise<void> => {
  const result = await cannonRepo.deleteByIdAndUser(pool, cannonId, userId);
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
    assertFound(await cannonRepo.exists(pool, cannonId, userId), CannonNotFoundError);
    await cannonRepo.updateTitle(pool, cannonId, title);
    return fetchCannonFn(cannonId);
  } else {
    const newCannon = await cannonRepo.insert(pool, userId, title);
    const created = newCannon.rows[0];
    if (!created) throw new CannonNotFoundError();
    return fetchCannonFn(created.cannon_id);
  }
};

export async function fetchCannon(cannonId: string, userId?: string): Promise<CannonResponse> {
  const cannon = assertFound(
    await cannonRepo.findById(pool, cannonId, userId),
    CannonNotFoundError,
  );

  const storiesResult = await storyRepo.findByCannonId(pool, cannonId);

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
  const cannonsResult = await cannonRepo.findByUserId(pool, userId);

  if (cannonsResult.rows.length === 0) return [];

  const storiesResult = await storyRepo.findByCannonIds(
    pool,
    cannonsResult.rows.map((cannon) => cannon.cannon_id),
  );

  const storyIds = storiesResult.rows.map((s) => s.story_id);
  const docsByStory = await fetchDocumentsForStories(storyIds);

  const storiesByCannon = new Map<string, StoryRowWithDocuments[]>();
  for (const story of storiesResult.rows) {
    const cannonStories = storiesByCannon.get(story.cannon_id) ?? [];
    cannonStories.push({ ...story, documents: docsByStory.get(story.story_id) ?? [] });
    storiesByCannon.set(story.cannon_id, cannonStories);
  }

  return cannonsResult.rows.map((cannon) =>
    mapCannonResponse(cannon, storiesByCannon.get(cannon.cannon_id) ?? []),
  );
}
