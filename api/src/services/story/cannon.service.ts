import { CannonNotFoundError } from '#constants/error/custom-errors';
import { UpsertCannonBody } from '#schemas/story.schemas';
import { CannonResponse } from '#types/shared/response';
import pool from '#config/database';
import { CannonRow, CannonFlatRow, StoryRow, DocumentRowWithBody, StoryRowWithDocuments } from '#types/database';
import { fetchDocumentsForStories } from '#utils/story/fetch-documents';
import { assertFound } from '#utils/database/assert-found';
import { decompressBody } from '#utils/compression';
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
    await cannonRepo.exists(pool, cannonId, userId, CannonNotFoundError);
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
  const { rows } = await cannonRepo.findByIdWithStoriesAndDocuments(pool, cannonId, userId);

  if (rows.length === 0) throw new CannonNotFoundError();

  const first = rows[0]!;
  const cannon: CannonRow = {
    cannon_id: first.cannon_id,
    user_id: first.user_id,
    title: first.cannon_title,
    created_at: first.cannon_created_at,
    updated_at: first.cannon_updated_at,
  };

  const storiesMap = new Map<string, { story: StoryRow; docs: DocumentRowWithBody[] }>();

  for (const row of rows) {
    if (!row.story_id) continue;

    if (!storiesMap.has(row.story_id)) {
      storiesMap.set(row.story_id, {
        story: {
          story_id: row.story_id,
          cannon_id: first.cannon_id,
          title: row.story_title!,
          predecessor_id: row.story_predecessor_id,
          successor_id: row.story_successor_id,
          created_at: row.story_created_at!,
          updated_at: row.story_updated_at!,
        },
        docs: [],
      });
    }

    if (row.document_id) {
      storiesMap.get(row.story_id)!.docs.push({
        document_id: row.document_id,
        story_id: row.story_id,
        title: row.doc_title!,
        predecessor_id: row.doc_predecessor_id,
        successor_id: row.doc_successor_id,
        created_at: row.doc_created_at!,
        updated_at: row.doc_updated_at!,
        body: row.body,
      });
    }
  }

  const stories: StoryRowWithDocuments[] = await Promise.all(
    [...storiesMap.values()].map(async ({ story, docs }) => ({
      ...story,
      documents: await Promise.all(
        docs.map(async (doc) => ({
          ...doc,
          body: doc.body ? await decompressBody(doc.body) : '',
        })),
      ),
    })),
  );

  return mapCannonResponse(cannon, stories);
};

export const fetchLegacy = async (userId: string): Promise<CannonResponse[]> => {
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
};
