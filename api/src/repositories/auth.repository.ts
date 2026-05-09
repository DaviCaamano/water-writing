import type { Queryable } from '#types/database';

export const insertToken = (q: Queryable, userId: string, token: string, expiresAt: Date) =>
  q.query('INSERT INTO authentication (user_id, token, expires_at) VALUES ($1, $2, $3)', [
    userId,
    token,
    expiresAt,
  ]);

export const deleteToken = (q: Queryable, token: string) =>
  q.query<{ user_id: string }>(
    'DELETE FROM authentication WHERE token = $1 RETURNING user_id',
    [token],
  );

export const validateToken = (q: Queryable, token: string, userId: string) =>
  q.query<{ user_id: string }>(
    'SELECT user_id FROM authentication WHERE token = $1 AND user_id = $2 AND expires_at > NOW()',
    [token, userId],
  );
