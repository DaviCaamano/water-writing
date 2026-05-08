import type { Queryable, CannonRow } from '#types/database';

export function findById(q: Queryable, cannonId: string, userId?: string) {
  return q.query<CannonRow>(
    `SELECT * FROM cannons WHERE cannon_id = $1${userId ? ' AND user_id = $2' : ''}`,
    userId ? [cannonId, userId] : [cannonId],
  );
}

export function findByUserId(q: Queryable, userId: string) {
  return q.query<CannonRow>('SELECT * FROM cannons WHERE user_id = $1 ORDER BY created_at', [
    userId,
  ]);
}

export function exists(q: Queryable, cannonId: string, userId: string) {
  return q.query<{ '?column?': number }>(
    'SELECT 1 FROM cannons WHERE cannon_id = $1 AND user_id = $2',
    [cannonId, userId],
  );
}

export function insert(q: Queryable, userId: string, title: string) {
  return q.query<CannonRow>(
    'INSERT INTO cannons (user_id, title) VALUES ($1, $2) RETURNING cannon_id',
    [userId, title],
  );
}

export function updateTitle(q: Queryable, cannonId: string, title: string) {
  return q.query('UPDATE cannons SET title = $1, updated_at = NOW() WHERE cannon_id = $2', [
    title,
    cannonId,
  ]);
}

export function deleteByIdAndUser(q: Queryable, cannonId: string, userId: string) {
  return q.query('DELETE FROM cannons WHERE cannon_id = $1 AND user_id = $2', [cannonId, userId]);
}
