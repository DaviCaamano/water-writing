import { DocumentRowWithBody, Queryable } from '#types/database';
import { UpsertDocumentBody } from '#schemas/story.schemas';
import { withTransaction } from '#utils/database/with-transaction';
import { DocumentNotFoundError, StoryNotFoundError } from '#constants/error/custom-errors';
import { DocumentResponse } from '#types/shared/response';
import { fetchCannon } from '#services/story/cannon.service';
import { compressBody, decompressBody } from '#utils/compression';
import pool from '#config/database';
import { assertFound } from '#utils/database/assert-found';
import * as documentRepo from '#repositories/document.repository';
import * as cannonRepo from '#repositories/cannon.repository';
import * as storyRepo from '#repositories/story.repository';
import { toJsonCamelCase } from '#utils/database/to-json-camel-case';

const toDocumentResponse = async (row: DocumentRowWithBody): Promise<DocumentResponse> =>
  toJsonCamelCase<Omit<DocumentRowWithBody, 'body'> & { body: string }, DocumentResponse>({
    ...row,
    body: row.body ? await decompressBody(row.body) : '',
  });

export const fetchDocument = async (documentId: string): Promise<DocumentResponse> => {
  const result = await documentRepo.findByIdWithBody(pool, documentId);
  return toDocumentResponse(assertFound(result, DocumentNotFoundError));
};

export const fetchUserDocument = async (
  userId: string,
  documentId: string,
): Promise<DocumentResponse> => {
  const result = await documentRepo.findByIdWithBodyAndUser(pool, documentId, userId);
  return toDocumentResponse(assertFound(result, DocumentNotFoundError));
};

export const deleteDocument = async (userId: string, documentId: string): Promise<void> => {
  return withTransaction(async (client) => {
    const { predecessor_id, successor_id } = assertFound(
      await documentRepo.findOwnedForUpdate(client, documentId, userId),
      DocumentNotFoundError,
    );

    if (predecessor_id && successor_id) {
      await documentRepo.setSuccessorId(client, predecessor_id, successor_id);
      await documentRepo.setPredecessorId(client, successor_id, predecessor_id);
    } else if (predecessor_id) {
      await documentRepo.setSuccessorId(client, predecessor_id, null);
    } else if (successor_id) {
      await documentRepo.setPredecessorId(client, successor_id, null);
    }

    await documentRepo.deleteById(client, documentId);
  });
};

const updateExistingDocument = async (
  client: Queryable,
  userId: string,
  documentId: string,
  title: string,
  body: string | undefined,
): Promise<string> => {
  const existingDoc = assertFound(
    await documentRepo.findOwnedWithCannonId(client, documentId, userId),
    DocumentNotFoundError,
  );

  await documentRepo.updateTitle(client, documentId, title);

  if (body !== undefined) {
    const compressed = await compressBody(body);
    await documentRepo.upsertContent(client, documentId, compressed);
  }

  return existingDoc.cannon_id;
};

const createNewDocument = async (
  client: Queryable,
  userId: string,
  title: string,
  body: string | undefined,
  storyId: string | undefined,
): Promise<string> => {
  let targetStoryId = storyId;
  let cannonId: string;

  if (!targetStoryId) {
    const cannonResult = await cannonRepo.insert(client, userId, 'Untitled Cannon');
    cannonId = cannonResult.rows[0]!.cannon_id;
    const storyResult = await storyRepo.insert(client, cannonId, 'Untitled Story');
    targetStoryId = storyResult.rows[0]!.story_id;
  } else {
    const story = assertFound(
      await documentRepo.findStoryForUser(client, targetStoryId, userId),
      StoryNotFoundError,
    );
    cannonId = story.cannon_id;
  }

  const lastDocResult = await documentRepo.findLastInStory(client, targetStoryId);
  const predecessorId = lastDocResult.rows.length > 0 ? lastDocResult.rows[0]!.document_id : null;

  const result = await documentRepo.insert(client, targetStoryId, title, predecessorId);
  const newDocId = result.rows[0]!.document_id;

  const compressed = await compressBody(body ?? '');
  await documentRepo.insertContent(client, newDocId, compressed);

  if (predecessorId) {
    await documentRepo.setSuccessorId(client, predecessorId, newDocId);
  }

  return cannonId;
};

export const upsertDocument = async (userId: string, data: UpsertDocumentBody) => {
  const { documentId, title, body, storyId } = data;

  const cannonId = await withTransaction(async (client) => {
    if (documentId) {
      return updateExistingDocument(client, userId, documentId, title, body);
    }
    return createNewDocument(client, userId, title, body, storyId);
  });

  return fetchCannon(cannonId);
};
