import pool from '#config/database';
import { DecompressedDocumentRow } from '#types/database';
import { decompressBody } from '#utils/compression';
import * as documentRepo from '#repositories/document.repository';

export async function fetchDocumentsForStories(
  storyIds: string[],
): Promise<Map<string, DecompressedDocumentRow[]>> {
  const docsByStory = new Map<string, DecompressedDocumentRow[]>();
  if (storyIds.length === 0) return docsByStory;

  const docsResult = await documentRepo.findByStoryIds(pool, storyIds);

  const decompressedDocs = await Promise.all(
    docsResult.rows.map(async (doc) => ({
      ...doc,
      body: doc.body ? await decompressBody(doc.body) : '',
    })),
  );

  for (const doc of decompressedDocs) {
    const arr = docsByStory.get(doc.story_id) ?? [];
    arr.push(doc);
    docsByStory.set(doc.story_id, arr);
  }

  return docsByStory;
}
