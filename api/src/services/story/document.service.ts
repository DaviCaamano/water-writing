import { DocumentRow, StoryRow } from '#types/database';
import { UpsertDocumentBody } from '#schemas/story.schemas';
import { withTransaction } from '#utils/database/with-transaction';
import { DocumentNotFoundError, StoryNotFoundError } from '#constants/error/custom-errors';
import { DocumentResponse } from '#types/shared/response';
import { fetchCannon } from '#services/story/cannon.service';
import pool from '#config/database';

export async function fetchDocument(documentId: string): Promise<DocumentResponse> {
  const result = await pool.query<DocumentRow>(
    `SELECT d.*, s.cannon_id FROM documents d
     JOIN stories s ON s.story_id = d.story_id
     WHERE d.document_id = $1`,
    [documentId],
  );
  if (result.rows.length === 0) {
    throw new DocumentNotFoundError();
  }
  const row = result.rows[0];
  return {
    documentId: row.document_id,
    storyId: row.story_id,
    title: row.title,
    body: row.body ?? '',
    predecessorId: row.predecessor_id,
    successorId: row.successor_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchUserDocument(
  userId: string,
  documentId: string,
): Promise<DocumentResponse> {
  const result = await pool.query<DocumentRow>(
    `SELECT d.*
     FROM documents d
     JOIN stories s ON s.story_id = d.story_id
     JOIN cannons w ON w.cannon_id = s.cannon_id
     WHERE d.document_id = $1 AND w.user_id = $2`,
    [documentId, userId],
  );
  if (result.rows.length === 0) {
    throw new DocumentNotFoundError();
  }
  const row = result.rows[0];
  return {
    documentId: row.document_id,
    storyId: row.story_id,
    title: row.title,
    body: row.body ?? '',
    predecessorId: row.predecessor_id,
    successorId: row.successor_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  return withTransaction(async (client) => {
    const existing = await client.query<DocumentRow>(
      `SELECT d.* FROM documents d
       JOIN stories s ON s.story_id = d.story_id
       JOIN cannons w ON w.cannon_id = s.cannon_id
       WHERE d.document_id = $1 AND w.user_id = $2
       FOR UPDATE`,
      [documentId, userId],
    );
    if (existing.rows.length === 0) {
      throw new DocumentNotFoundError();
    }
    const { predecessor_id, successor_id } = existing.rows[0];

    if (predecessor_id && successor_id) {
      await client.query(
        'UPDATE documents SET successor_id = $1, updated_at = NOW() WHERE document_id = $2',
        [successor_id, predecessor_id],
      );
      await client.query(
        'UPDATE documents SET predecessor_id = $1, updated_at = NOW() WHERE document_id = $2',
        [predecessor_id, successor_id],
      );
    } else if (predecessor_id) {
      await client.query(
        'UPDATE documents SET successor_id = NULL, updated_at = NOW() WHERE document_id = $1',
        [predecessor_id],
      );
    } else if (successor_id) {
      await client.query(
        'UPDATE documents SET predecessor_id = NULL, updated_at = NOW() WHERE document_id = $1',
        [successor_id],
      );
    }

    await client.query('DELETE FROM documents WHERE document_id = $1', [documentId]);
  });
}

export async function upsertDocument(userId: string, data: UpsertDocumentBody) {
  const { documentId, title, body, storyId } = data;

  const cannonId = await withTransaction(async (client) => {
    let targetStoryId = storyId;
    let persistedCannonId: string;

    // If documentId is provided, update the existing document
    if (documentId) {
      const existingDoc = await client.query<DocumentRow & { user_id: string; cannon_id: string }>(
        `SELECT d.*, w.user_id, s.cannon_id FROM documents d
         JOIN stories s ON s.story_id = d.story_id
         JOIN (SELECT w2.cannon_id, w2.user_id FROM cannons w2 WHERE w2.user_id = $1) w ON w.cannon_id = s.cannon_id
         WHERE d.document_id = $2`,
        [userId, documentId],
      );

      if (existingDoc.rows.length === 0) {
        throw new DocumentNotFoundError();
      }

      await client.query(
        'UPDATE documents SET title = $1, body = $2, updated_at = NOW() WHERE document_id = $3',
        [title, body ?? existingDoc.rows[0].body, documentId],
      );

      persistedCannonId = existingDoc.rows[0].cannon_id;
      return persistedCannonId;
    }

    // Create a new document: determine or create the story
    if (!targetStoryId) {
      const cannonResult = await client.query(
        'INSERT INTO cannons (user_id, title) VALUES ($1, $2) RETURNING cannon_id',
        [userId, 'Untitled Cannon'],
      );
      persistedCannonId = cannonResult.rows[0].cannon_id;
      const storyResult = await client.query(
        'INSERT INTO stories (cannon_id, title) VALUES ($1, $2) RETURNING story_id',
        [persistedCannonId, 'Untitled Story'],
      );
      targetStoryId = storyResult.rows[0].story_id;
    } else {
      const storyResult = await client.query<StoryRow>(
        `SELECT s.* FROM stories s
         JOIN cannons w ON w.cannon_id = s.cannon_id
         WHERE s.story_id = $1 AND w.user_id = $2`,
        [targetStoryId, userId],
      );
      if (storyResult.rows.length === 0) {
        throw new StoryNotFoundError();
      }
      persistedCannonId = storyResult.rows[0].cannon_id;
    }

    // Get the last document in the chain with row-level locking to prevent race conditions
    const lastDocResult = await client.query<DocumentRow>(
      `SELECT * FROM documents WHERE story_id = $1 AND successor_id IS NULL
       ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [targetStoryId],
    );
    const predecessorId = lastDocResult.rows.length > 0 ? lastDocResult.rows[0].document_id : null;

    // Insert new document
    const result = await client.query(
      `INSERT INTO documents (story_id, title, body, predecessor_id)
       VALUES ($1, $2, $3, $4) RETURNING document_id`,
      [targetStoryId, title, body, predecessorId],
    );
    const newDocId = result.rows[0].document_id;

    // Update predecessor's successor if one exists
    if (predecessorId) {
      await client.query(
        'UPDATE documents SET successor_id = $1, updated_at = NOW() WHERE document_id = $2',
        [newDocId, predecessorId],
      );
    }

    return persistedCannonId;
  });

  return fetchCannon(cannonId);
}
