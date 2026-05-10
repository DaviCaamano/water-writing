import pool from '#config/database';
import { DecompressedDocumentRow, Queryable } from '#types/database';
import { decompressBody } from '#utils/compression';
import * as documentRepo from '#repositories/story/document.repository';

export const fetchDocumentsForStories = async (
  storyIds: string[],
  q: Queryable = pool,
): Promise<Map<string, DecompressedDocumentRow[]>> => {
  const docsByStory = new Map<string, DecompressedDocumentRow[]>();
  if (storyIds.length === 0) return docsByStory;

  const docsResult = await documentRepo.findByStoryIds(q, storyIds);

  const decompressedDocs = await Promise.all(
    docsResult.rows.map(async (doc) => ({
      ...doc,
      body: doc.body ? await decompressBody(doc.body) : '',
    })),
  );

  for (const doc of decompressedDocs) {
    const storyDocs = docsByStory.get(doc.story_id) ?? [];
    storyDocs.push(doc);
    docsByStory.set(doc.story_id, storyDocs);
  }

  return docsByStory;
};
