import { DocumentRowWithBody, StoryRow } from '#types/database';
import { UpsertDocumentBody } from '#schemas/story.schemas';
import { withTransaction } from '#utils/database/with-transaction';
import { DocumentNotFoundError, StoryNotFoundError } from '#constants/error/custom-errors';
import { DocumentResponse } from '#types/shared/response';
import { fetchCannon } from '#services/story/cannon.service';
import { compressBody, decompressBody } from '#utils/compression';
import pool from '#config/database';

async function toDocumentResponse(row: DocumentRowWithBody): Promise<DocumentResponse> {
  return {
    documentId: row.document_id,
    storyId: row.story_id,
    title: row.title,
    body: row.body ? await decompressBody(row.body) : '',
    predecessorId: row.predecessor_id,
    successorId: row.successor_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchDocument(documentId: string): Promise<DocumentResponse> {
  const result = await pool.query<DocumentRowWithBody>(
    `SELECT d.*, dc.body FROM documents d
     LEFT JOIN document_content dc ON dc.document_id = d.document_id
     JOIN stories s ON s.story_id = d.story_id
     WHERE d.document_id = $1`,
    [documentId],
  );
  if (result.rows.length === 0) {
    throw new DocumentNotFoundError();
  }
  return toDocumentResponse(result.rows[0]);
}

export async function fetchUserDocument(
  userId: string,
  documentId: string,
): Promise<DocumentResponse> {
  const result = await pool.query<DocumentRowWithBody>(
    `SELECT d.*, dc.body
     FROM documents d
     LEFT JOIN document_content dc ON dc.document_id = d.document_id
     JOIN stories s ON s.story_id = d.story_id
     JOIN cannons w ON w.cannon_id = s.cannon_id
     WHERE d.document_id = $1 AND w.user_id = $2`,
    [documentId, userId],
  );
  if (result.rows.length === 0) {
    throw new DocumentNotFoundError();
  }
  return toDocumentResponse(result.rows[0]);
}

export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  return withTransaction(async (client) => {
    const existing = await client.query<DocumentRowWithBody>(
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

async function updateExistingDocument(
  client: { query: InstanceType<typeof import('pg').Pool>['query'] },
  userId: string,
  documentId: string,
  title: string,
  body: string | undefined,
): Promise<string> {
  const existingDoc = await client.query<DocumentRowWithBody & { cannon_id: string }>(
    `SELECT d.*, dc.body, s.cannon_id FROM documents d
     LEFT JOIN document_content dc ON dc.document_id = d.document_id
     JOIN stories s ON s.story_id = d.story_id
     JOIN (SELECT w2.cannon_id, w2.user_id FROM cannons w2 WHERE w2.user_id = $1) w ON w.cannon_id = s.cannon_id
     WHERE d.document_id = $2`,
    [userId, documentId],
  );

  if (existingDoc.rows.length === 0) {
    throw new DocumentNotFoundError();
  }

  await client.query(
    'UPDATE documents SET title = $1, updated_at = NOW() WHERE document_id = $2',
    [title, documentId],
  );

  if (body !== undefined) {
    const compressed = await compressBody(body);
    await client.query(
      `INSERT INTO document_content (document_id, body) VALUES ($1, $2)
       ON CONFLICT (document_id) DO UPDATE SET body = $2`,
      [documentId, compressed],
    );
  }

  return existingDoc.rows[0].cannon_id;
}

async function createNewDocument(
  client: { query: InstanceType<typeof import('pg').Pool>['query'] },
  userId: string,
  title: string,
  body: string | undefined,
  storyId: string | undefined,
): Promise<string> {
  let targetStoryId = storyId;
  let cannonId: string;

  if (!targetStoryId) {
    const cannonResult = await client.query(
      'INSERT INTO cannons (user_id, title) VALUES ($1, $2) RETURNING cannon_id',
      [userId, 'Untitled Cannon'],
    );
    cannonId = cannonResult.rows[0].cannon_id;
    const storyResult = await client.query(
      'INSERT INTO stories (cannon_id, title) VALUES ($1, $2) RETURNING story_id',
      [cannonId, 'Untitled Story'],
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
    cannonId = storyResult.rows[0].cannon_id;
  }

  const lastDocResult = await client.query<DocumentRowWithBody>(
    `SELECT * FROM documents WHERE story_id = $1 AND successor_id IS NULL
     ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
    [targetStoryId],
  );
  const predecessorId = lastDocResult.rows.length > 0 ? lastDocResult.rows[0].document_id : null;

  const result = await client.query(
    `INSERT INTO documents (story_id, title, predecessor_id)
     VALUES ($1, $2, $3) RETURNING document_id`,
    [targetStoryId, title, predecessorId],
  );
  const newDocId = result.rows[0].document_id;

  const compressed = await compressBody(body ?? '');
  await client.query(
    'INSERT INTO document_content (document_id, body) VALUES ($1, $2)',
    [newDocId, compressed],
  );

  if (predecessorId) {
    await client.query(
      'UPDATE documents SET successor_id = $1, updated_at = NOW() WHERE document_id = $2',
      [newDocId, predecessorId],
    );
  }

  return cannonId;
}

export async function upsertDocument(userId: string, data: UpsertDocumentBody) {
  const { documentId, title, body, storyId } = data;

  const cannonId = await withTransaction(async (client) => {
    if (documentId) {
      return updateExistingDocument(client, userId, documentId, title, body);
    }
    return createNewDocument(client, userId, title, body, storyId);
  });

  return fetchCannon(cannonId);
}
