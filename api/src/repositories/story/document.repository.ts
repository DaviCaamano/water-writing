import type { Queryable, DocumentRowWithBody, StoryRow } from '#types/database';

export const findByIdWithBody = (q: Queryable, documentId: string) =>
  q.query<DocumentRowWithBody>(
    `SELECT d.*, dc.body
      FROM documents d
      LEFT JOIN document_content dc ON dc.document_id = d.document_id
      JOIN stories s ON s.story_id = d.story_id
      WHERE d.document_id = $1`,
    [documentId],
  );

export const findByIdWithBodyAndUser = (q: Queryable, documentId: string, userId: string) =>
  q.query<DocumentRowWithBody>(
    `SELECT d.*, dc.body
      FROM documents d
      LEFT JOIN document_content dc ON dc.document_id = d.document_id
      JOIN stories s ON s.story_id = d.story_id
      JOIN cannons c ON c.cannon_id = s.cannon_id
      WHERE d.document_id = $1 AND c.user_id = $2`,
    [documentId, userId],
  );

export const findOwnedWithCannonId = (q: Queryable, documentId: string, userId: string) =>
  q.query<DocumentRowWithBody & { cannon_id: string }>(
    `SELECT d.*, dc.body, s.cannon_id FROM documents d
      LEFT JOIN document_content dc ON dc.document_id = d.document_id
      JOIN stories s ON s.story_id = d.story_id
      JOIN (SELECT c2.cannon_id, c2.user_id FROM cannons c2 WHERE c2.user_id = $1) c ON c.cannon_id = s.cannon_id
      WHERE d.document_id = $2`,
    [userId, documentId],
  );

export const findOwnedForUpdate = (q: Queryable, documentId: string, userId: string) =>
  q.query<DocumentRowWithBody>(
    `SELECT d.*
      FROM documents d
      JOIN stories s ON s.story_id = d.story_id
      JOIN cannons c ON c.cannon_id = s.cannon_id
      WHERE d.document_id = $1 AND c.user_id = $2
      FOR UPDATE`,
    [documentId, userId],
  );

export const findByStoryId = (q: Queryable, storyId: string) =>
  q.query<DocumentRowWithBody>(
    `SELECT d.*, dc.body
      FROM documents d
      LEFT JOIN document_content dc ON dc.document_id = d.document_id
      WHERE d.story_id = $1 ORDER BY d.created_at`,
    [storyId],
  );

export const findByStoryIds = (q: Queryable, storyIds: string[]) =>
  q.query<DocumentRowWithBody>(
    `SELECT d.*, dc.body FROM documents d
      LEFT JOIN document_content dc ON dc.document_id = d.document_id
      WHERE d.story_id = ANY($1) ORDER BY d.created_at`,
    [storyIds],
  );

export const findLastInStory = (q: Queryable, storyId: string) =>
  q.query<DocumentRowWithBody>(
    `SELECT * FROM documents WHERE story_id = $1 AND successor_id IS NULL
      ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
    [storyId],
  );

export const findStoryForUser = (q: Queryable, storyId: string, userId: string) =>
  q.query<StoryRow>(
    `SELECT s.* FROM stories s
      JOIN cannons c ON c.cannon_id = s.cannon_id
      WHERE s.story_id = $1 AND c.user_id = $2`,
    [storyId, userId],
  );

export const insert = (
  q: Queryable,
  storyId: string,
  title: string,
  predecessorId: string | null,
) =>
  q.query<{ document_id: string }>(
    `INSERT INTO documents (story_id, title, predecessor_id)
      VALUES ($1, $2, $3) RETURNING document_id`,
    [storyId, title, predecessorId],
  );

export const updateTitle = (q: Queryable, documentId: string, title: string) =>
  q.query('UPDATE documents SET title = $1, updated_at = NOW() WHERE document_id = $2', [
    title,
    documentId,
  ]);

export const setSuccessorId = (q: Queryable, documentId: string, successorId: string | null) =>
  q.query('UPDATE documents SET successor_id = $1, updated_at = NOW() WHERE document_id = $2', [
    successorId,
    documentId,
  ]);

export const setPredecessorId = (q: Queryable, documentId: string, predecessorId: string | null) =>
  q.query('UPDATE documents SET predecessor_id = $1, updated_at = NOW() WHERE document_id = $2', [
    predecessorId,
    documentId,
  ]);

export const deleteById = (q: Queryable, documentId: string) =>
  q.query('DELETE FROM documents WHERE document_id = $1', [documentId]);

export const upsertContent = (q: Queryable, documentId: string, body: Buffer) =>
  q.query(
    `INSERT INTO document_content (document_id, body) VALUES ($1, $2)
      ON CONFLICT (document_id) DO UPDATE SET body = $2`,
    [documentId, body],
  );

export const insertContent = (q: Queryable, documentId: string, body: Buffer) =>
  q.query('INSERT INTO document_content (document_id, body) VALUES ($1, $2)', [documentId, body]);
