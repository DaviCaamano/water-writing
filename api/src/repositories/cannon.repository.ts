import type { Queryable, CannonRow } from '#types/database';
import { QueryResult } from 'pg';

export const findById = (q: Queryable, cannonId: string, userId?: string) =>
  q.query<CannonRow>(
    `SELECT * FROM cannons WHERE cannon_id = $1${userId ? ' AND user_id = $2' : ''}`,
    userId ? [cannonId, userId] : [cannonId],
  );

export const findByUserId = (q: Queryable, userId: string) =>
  q.query<CannonRow>('SELECT * FROM cannons WHERE user_id = $1 ORDER BY created_at', [
    userId,
  ]);

export const exists = (q: Queryable, cannonId: string, userId: string) =>
  q.query<{ '?column?': number }>(
    'SELECT 1 FROM cannons WHERE cannon_id = $1 AND user_id = $2',
    [cannonId, userId],
  );

export const insert = (q: Queryable, userId: string, title: string) =>
  q.query<CannonRow>(
    'INSERT INTO cannons (user_id, title) VALUES ($1, $2) RETURNING cannon_id',
    [userId, title],
  );

export const updateTitle = (q: Queryable, cannonId: string, title: string) =>
  q.query('UPDATE cannons SET title = $1, updated_at = NOW() WHERE cannon_id = $2', [
    title,
    cannonId,
  ]);

export const deleteByIdAndUser = (q: Queryable, cannonId: string, userId: string) =>
  q.query('DELETE FROM cannons WHERE cannon_id = $1 AND user_id = $2', [cannonId, userId]);
