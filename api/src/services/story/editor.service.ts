import pool from '#config/database';
import anthropic, { editorModel } from '#config/anthropic';
import { DocumentRowWithBody } from '#types/database';
import { DocumentNotFoundError, InvalidSelectionError } from '#constants/error/custom-errors';
import { decompressBody } from '#utils/compression';

interface ContextDocument {
  document_id: string;
  title: string;
  body: string;
  predecessor_id: string | null;
  successor_id: string | null;
  story_id: string;
}

async function fetchContextDocuments(
  userId: string,
  documentId: string,
): Promise<ContextDocument[]> {
  const result = await pool.query<DocumentRowWithBody>(
    `SELECT d2.document_id, d2.title, dc.body, d2.predecessor_id, d2.successor_id,
            d2.story_id, d2.created_at, d2.updated_at
     FROM documents d
     JOIN stories s ON s.story_id = d.story_id
     JOIN cannons w ON w.cannon_id = s.cannon_id
     JOIN documents d2 ON d2.story_id = d.story_id
       AND (
         d2.document_id = d.document_id
         OR d2.document_id = d.predecessor_id
         OR d2.document_id = d.successor_id
       )
     LEFT JOIN document_content dc ON dc.document_id = d2.document_id
     WHERE d.document_id = $1 AND w.user_id = $2
     ORDER BY CASE
       WHEN d2.document_id = d.predecessor_id THEN 0
       WHEN d2.document_id = d.document_id    THEN 1
       WHEN d2.document_id = d.successor_id   THEN 2
     END`,
    [documentId, userId],
  );

  if (result.rows.length === 0) throw new DocumentNotFoundError();

  return Promise.all(
    result.rows.map(async (row) => ({
      document_id: row.document_id,
      title: row.title,
      body: row.body ? await decompressBody(row.body) : '',
      predecessor_id: row.predecessor_id,
      successor_id: row.successor_id,
      story_id: row.story_id,
    })),
  );
}

export async function waterWrite(
  userId: string,
  documentId: string,
  selection: { start: number; end: number },
  prompt: string,
): Promise<AsyncIterable<string>> {
  const documents = await fetchContextDocuments(userId, documentId);
  const current = documents.find((d) => d.document_id === documentId)!;
  const body = current.body ?? '';

  if (selection.end > body.length) {
    throw new InvalidSelectionError();
  }

  const storyContext = documents
    .map((doc) => `# ${doc.title}\n\n${doc.body ?? ''}`)
    .join('\n\n---\n\n');

  const stream = anthropic.messages.stream({
    model: editorModel,
    max_tokens: 1000,
    system: `You are an expert creative writing assistant.
The user will provide you with story context in a <story> tag,
two indexes which represent a substring of the story text inside <startSelectionIndex> and <endSelectionindex> tags,
and instructions for how to replace substring inside an <instructions> tag.
Return ONLY the replacement text — no preamble, no explanation, no quotation marks around the output.`,
    messages: [
      {
        role: 'user',
        content: `<story>\n${storyContext}\n</story>\n\n<startSelectionIndex>\n${selection.start}\n</startSelectionIndex>\n\n<endSelectionindex>\n${selection.end}\n</endSelectionindex>\n\n<instructions>\n${prompt}\n</instructions>`,
      },
    ],
  });

  return {
    async *[Symbol.asyncIterator]() {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      }
    },
  };
}
