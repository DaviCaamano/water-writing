import pool from '#config/database';
import { DecompressedDocumentRow, DocumentRowWithBody } from '#types/database';
import { decompressBody } from '#utils/compression';

export async function fetchDocumentsForStories(
  storyIds: string[],
): Promise<Map<string, DecompressedDocumentRow[]>> {
  const docsByStory = new Map<string, DecompressedDocumentRow[]>();
  if (storyIds.length === 0) return docsByStory;

  const docsResult = await pool.query<DocumentRowWithBody>(
    `SELECT d.*, dc.body FROM documents d
     LEFT JOIN document_content dc ON dc.document_id = d.document_id
     WHERE d.story_id = ANY($1) ORDER BY d.created_at`,
    [storyIds],
  );

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
