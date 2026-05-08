import type { Queryable, StoryRow } from '#types/database';

export function findById(q: Queryable, storyId: string) {
  return q.query<StoryRow>('SELECT * FROM stories WHERE story_id = $1', [storyId]);
}

export function findByIdWithUser(q: Queryable, storyId: string, userId: string) {
  return q.query<StoryRow>(
    `SELECT s.* FROM stories s
     JOIN cannons w ON w.cannon_id = s.cannon_id
     WHERE s.story_id = $1 AND w.user_id = $2`,
    [storyId, userId],
  );
}

export function findByIdWithUserOwnership(q: Queryable, storyId: string, userId: string) {
  return q.query<StoryRow & { user_id: string }>(
    `SELECT s.*, w.user_id FROM stories s
     JOIN cannons w ON w.cannon_id = s.cannon_id
     WHERE s.story_id = $1 AND w.user_id = $2`,
    [storyId, userId],
  );
}

export function findByCannonId(q: Queryable, cannonId: string) {
  return q.query<StoryRow>(
    'SELECT * FROM stories WHERE cannon_id = $1 ORDER BY created_at',
    [cannonId],
  );
}

export function findByCannonIds(q: Queryable, cannonIds: string[]) {
  return q.query<StoryRow>(
    'SELECT * FROM stories WHERE cannon_id = ANY($1) ORDER BY created_at',
    [cannonIds],
  );
}

export function findByUserId(q: Queryable, userId: string) {
  return q.query<StoryRow>(
    `SELECT s.*
     FROM stories s
     JOIN cannons w ON w.cannon_id = s.cannon_id
     WHERE w.user_id = $1
     ORDER BY s.created_at`,
    [userId],
  );
}

export function userOwnsStory(q: Queryable, storyId: string, userId: string) {
  return q.query<{ '?column?': number }>(
    `SELECT 1
     FROM stories s
     JOIN cannons w ON w.cannon_id = s.cannon_id
     WHERE s.story_id = $1 AND w.user_id = $2`,
    [storyId, userId],
  );
}

export function insert(q: Queryable, cannonId: string, title: string | null) {
  return q.query<StoryRow>(
    'INSERT INTO stories (cannon_id, title) VALUES ($1, $2) RETURNING story_id',
    [cannonId, title],
  );
}

export function updateTitle(q: Queryable, storyId: string, title: string) {
  return q.query(
    'UPDATE stories SET title = $1, updated_at = NOW() WHERE story_id = $2',
    [title, storyId],
  );
}

export function updateCannonId(q: Queryable, storyId: string, cannonId: string) {
  return q.query(
    'UPDATE stories SET cannon_id = $1, updated_at = NOW() WHERE story_id = $2',
    [cannonId, storyId],
  );
}

export function deleteByIdAndUser(q: Queryable, storyId: string, userId: string) {
  return q.query(
    `DELETE FROM stories
     WHERE story_id = $1
       AND cannon_id IN (SELECT cannon_id FROM cannons WHERE user_id = $2)`,
    [storyId, userId],
  );
}
