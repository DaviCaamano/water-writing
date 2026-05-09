import { CannonNotFoundError } from '#constants/error/custom-errors';
import { UpsertCannonBody } from '#schemas/story.schemas';
import { CannonResponse } from '#types/shared/response';
import pool from '#config/database';
import { StoryRowWithDocuments } from '#types/database';
import { fetchDocumentsForStories } from '#utils/story/fetch-documents';
import { assertFound } from '#utils/database/assert-found';
import * as cannonRepo from '#repositories/cannon.repository';
import * as storyRepo from '#repositories/story.repository';
import { mapCannonResponse } from '#utils/database/to-json-camel-case';

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

export const fetchCannon = async (cannonId: string, userId?: string): Promise<CannonResponse> => {
  const [cannonResult, storiesResult] = await Promise.all([
    cannonRepo.findById(pool, cannonId, userId),
    storyRepo.findByCannonId(pool, cannonId),
  ]);

  const cannon = assertFound(cannonResult, CannonNotFoundError);

  const storyIds = storiesResult.rows.map((s) => s.story_id);
  const docsByStory = await fetchDocumentsForStories(storyIds);

  const stories: StoryRowWithDocuments[] = storiesResult.rows.map((story) => ({
    ...story,
    documents: docsByStory.get(story.story_id) ?? [],
  }));

  return mapCannonResponse(cannon, stories);
};

export const fetchLegacy = async (userId: string): Promise<CannonResponse[]> => {
  const [cannonsResult, storiesResult] = await Promise.all([
    cannonRepo.findByUserId(pool, userId),
    storyRepo.findByUserId(pool, userId),
  ]);

  if (cannonsResult.rows.length === 0) return [];

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
};
