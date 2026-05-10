import type { ExistsResult, Queryable, StoryRow } from '#types/database';

export const findById = (q: Queryable, storyId: string) =>
  q.query<StoryRow>('SELECT * FROM stories WHERE story_id = $1', [storyId]);

export const findByIdWithUser = (q: Queryable, storyId: string, userId: string) =>
  q.query<StoryRow>(
    `SELECT s.* FROM stories s
      JOIN cannons c ON c.cannon_id = s.cannon_id
      WHERE s.story_id = $1 AND c.user_id = $2`,
    [storyId, userId],
  );

export const findByIdWithUserOwnership = (q: Queryable, storyId: string, userId: string) =>
  q.query<StoryRow & { user_id: string }>(
    `SELECT s.*, c.user_id FROM stories s
      JOIN cannons c ON c.cannon_id = s.cannon_id
      WHERE s.story_id = $1 AND c.user_id = $2`,
    [storyId, userId],
  );

export const findByCannonId = (q: Queryable, cannonId: string) =>
  q.query<StoryRow>('SELECT * FROM stories WHERE cannon_id = $1 ORDER BY created_at', [cannonId]);

export const findByCannonIds = (q: Queryable, cannonIds: string[]) =>
  q.query<StoryRow>('SELECT * FROM stories WHERE cannon_id = ANY($1) ORDER BY created_at', [
    cannonIds,
  ]);

export const findByUserId = (q: Queryable, userId: string) =>
  q.query<StoryRow>(
    `SELECT s.*
      FROM stories s
      JOIN cannons c ON c.cannon_id = s.cannon_id
      WHERE c.user_id = $1
      ORDER BY s.created_at`,
    [userId],
  );

export const userOwnsStory = (q: Queryable, storyId: string, userId: string) =>
  q.query<ExistsResult>(
    `SELECT 1 as exists
      FROM stories s
      JOIN cannons c ON c.cannon_id = s.cannon_id
      WHERE s.story_id = $1 AND c.user_id = $2`,
    [storyId, userId],
  );

export const insert = (q: Queryable, cannonId: string, title: string | null) =>
  q.query<StoryRow>('INSERT INTO stories (cannon_id, title) VALUES ($1, $2) RETURNING story_id', [
    cannonId,
    title,
  ]);

export const updateTitle = (q: Queryable, storyId: string, title: string) =>
  q.query('UPDATE stories SET title = $1, updated_at = NOW() WHERE story_id = $2', [
    title,
    storyId,
  ]);

export const updateCannonId = (q: Queryable, storyId: string, cannonId: string) =>
  q.query('UPDATE stories SET cannon_id = $1, updated_at = NOW() WHERE story_id = $2', [
    cannonId,
    storyId,
  ]);

export const deleteByIdAndUser = (q: Queryable, storyId: string, userId: string) =>
  q.query(
    `DELETE FROM stories
      WHERE story_id = $1
      AND cannon_id IN (SELECT c.cannon_id FROM cannons c WHERE c.user_id = $2)`,
    [storyId, userId],
  );
