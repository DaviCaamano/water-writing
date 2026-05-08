jest.mock('#config/anthropic', () => ({
  __esModule: true,
  default: { messages: { stream: jest.fn() } },
  editorModel: 'claude-haiku-4-5',
}));
jest.mock('#utils/compression', () => ({
  decompressBody: async (buf: unknown) => (typeof buf === 'string' ? buf : String(buf)),
  compressBody: async (text: string) => Buffer.from(text),
}));

import anthropic from '#config/anthropic';
import { waterWrite } from '#services/story/editor.service';
import { DocumentNotFoundError, InvalidSelectionError } from '#constants/error/custom-errors';
import { MOCK_USER_ID } from '#__tests__/constants/mock-user';
import { MOCK_DOC, MOCK_DOC_ID, mockPool } from '#__tests__/constants/mock-story';
import { mockClear } from '#__tests__/utils/test-wrappers';

const mockStream = anthropic.messages.stream as jest.Mock;

async function collectStream(iterable: AsyncIterable<string>): Promise<string[]> {
  const chunks: string[] = [];
  for await (const text of iterable) {
    chunks.push(text);
  }
  return chunks;
}

const asyncIter = (events: unknown[]) => ({
  async *[Symbol.asyncIterator]() {
    for (const e of events) yield e;
  },
});

describe(
  'editText',
  mockClear(() => {
    it('[fetchContextDocuments] throws DocumentNotFoundError when no rows match', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        waterWrite(MOCK_USER_ID, MOCK_DOC_ID, { start: 0, end: 5 }, 'rewrite'),
      ).rejects.toThrow(DocumentNotFoundError);
    });

    it('[fetchContextDocuments] throws InvalidSelectionError when end exceeds body length', async () => {
      const body = 'short';
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...MOCK_DOC, body }],
      });

      await expect(
        waterWrite(MOCK_USER_ID, MOCK_DOC_ID, { start: 0, end: body.length + 1 }, 'rewrite'),
      ).rejects.toThrow(InvalidSelectionError);
    });

    it('yields text deltas from the stream', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...MOCK_DOC, body: 'Hello world' }],
      });
      mockStream.mockReturnValueOnce(
        asyncIter([
          { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hi ' } },
          { type: 'content_block_delta', delta: { type: 'text_delta', text: 'there' } },
          { type: 'message_stop' },
        ]),
      );

      const iterable = await waterWrite(MOCK_USER_ID, MOCK_DOC_ID, { start: 0, end: 5 }, 'rewrite');
      const chunks = await collectStream(iterable);

      expect(chunks).toEqual(['Hi ', 'there']);
    });

    it('passes the sliced selection text to anthropic', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ ...MOCK_DOC, body: 'Hello world' }],
      });
      mockStream.mockReturnValueOnce(asyncIter([]));

      const iterable = await waterWrite(MOCK_USER_ID, MOCK_DOC_ID, { start: 6, end: 11 }, 'make it louder');
      await collectStream(iterable);

      const args = mockStream.mock.calls[0][0];
      expect(args.messages[0].content).toContain(
        '<startSelectionIndex>\n6\n</startSelectionIndex>',
      );
      expect(args.messages[0].content).toContain('<endSelectionIndex>\n11\n</endSelectionIndex>');
      expect(args.messages[0].content).toContain('<instructions>\nmake it louder\n</instructions>');
    });
  }),
);
