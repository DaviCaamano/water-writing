import type { Queryable } from '#types/database';

export function insertToken(q: Queryable, userId: string, token: string, expiresAt: Date) {
  return q.query('INSERT INTO authentication (user_id, token, expires_at) VALUES ($1, $2, $3)', [
    userId,
    token,
    expiresAt,
  ]);
}

export function deleteToken(q: Queryable, token: string) {
  return q.query<{ user_id: string }>(
    'DELETE FROM authentication WHERE token = $1 RETURNING user_id',
    [token],
  );
}

export function validateToken(q: Queryable, token: string, userId: string) {
  return q.query<{ user_id: string }>(
    'SELECT user_id FROM authentication WHERE token = $1 AND user_id = $2 AND expires_at > NOW()',
    [token, userId],
  );
}
