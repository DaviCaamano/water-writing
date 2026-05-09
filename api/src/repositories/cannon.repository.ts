import type { Queryable, CannonRow, CannonFlatRow } from '#types/database';
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

export const findByIdWithStoriesAndDocuments = (q: Queryable, cannonId: string, userId?: string) =>
  q.query<CannonFlatRow>(
    `SELECT
      c.cannon_id, c.user_id,
      c.title AS cannon_title, c.created_at AS cannon_created_at, c.updated_at AS cannon_updated_at,
      s.story_id, s.title AS story_title,
      s.predecessor_id AS story_predecessor_id, s.successor_id AS story_successor_id,
      s.created_at AS story_created_at, s.updated_at AS story_updated_at,
      d.document_id, d.title AS doc_title,
      d.predecessor_id AS doc_predecessor_id, d.successor_id AS doc_successor_id,
      d.created_at AS doc_created_at, d.updated_at AS doc_updated_at,
      dc.body
    FROM cannons c
    LEFT JOIN stories s ON s.cannon_id = c.cannon_id
    LEFT JOIN documents d ON d.story_id = s.story_id
    LEFT JOIN document_content dc ON dc.document_id = d.document_id
    WHERE c.cannon_id = $1${userId ? ' AND c.user_id = $2' : ''}`,
    userId ? [cannonId, userId] : [cannonId],
  );
