import { MOCK_USER_ID } from '#__tests__/constants/mock-user';

jest.mock('#services/story/cannon.service');
jest.mock('#utils/database/with-transaction');
jest.mock('#utils/compression', () => ({
  decompressBody: async (buf: unknown) => (typeof buf === 'string' ? buf : String(buf)),
  compressBody: async (text: string) => Buffer.from(text),
}));

import { withTransaction } from '#utils/database/with-transaction';
import {
  deleteDocument,
  fetchDocument,
  fetchUserDocument,
  upsertDocument,
} from '#services/story/document.service';
import { DocumentNotFoundError, StoryNotFoundError } from '#constants/error/custom-errors';
import { fetchCannon } from '#services/story/cannon.service';
import {
  MOCK_DOC_ID,
  MOCK_STORY_ID,
  MOCK_CANNON_ID,
  MOCK_DOC,
  MOCK_DOC_RESPONSE,
  MOCK_CANNON_RESPONSE,
  mockPool,
} from '#__tests__/constants/mock-story';
import { createMockClient } from '#__tests__/constants/mock-database';
import { mockClear } from '#__tests__/utils/test-wrappers';

const mockFetchCannon = fetchCannon as jest.MockedFunction<typeof fetchCannon>;
const mockWithTransaction = withTransaction as jest.MockedFunction<typeof withTransaction>;

describe(
  'fetchDocument',
  mockClear(() => {
    it('should fetch a document by its ID', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [MOCK_DOC] });
      expect(await fetchDocument(MOCK_DOC_ID)).toEqual(MOCK_DOC_RESPONSE);
    });

    it('throws DocumentNotFoundError when no row matches the document', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      await expect(fetchDocument(MOCK_DOC_ID)).rejects.toThrow(DocumentNotFoundError);
    });
  }),
);

describe(
  'fetchUserDocument',
  mockClear(() => {
    it('returns the document when it belongs to the user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [MOCK_DOC] });

      const result = await fetchUserDocument(MOCK_USER_ID, MOCK_DOC_ID);

      expect(result).toEqual(MOCK_DOC_RESPONSE);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('JOIN cannons w'), [
        MOCK_DOC_ID,
        MOCK_USER_ID,
      ]);
    });

    it('throws DocumentNotFoundError when no row matches the user/document pair', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(fetchUserDocument(MOCK_USER_ID, MOCK_DOC_ID)).rejects.toThrow(
        DocumentNotFoundError,
      );
    });
  }),
);

describe(
  'deleteDocument',
  mockClear(() => {
    it('relinks predecessor and successor when deleting a middle document', async () => {
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...MOCK_DOC, predecessor_id: 'pred-id', successor_id: 'succ-id' }],
      }); // SELECT existing doc
      mockClient.query.mockResolvedValueOnce({}); // UPDATE predecessor
      mockClient.query.mockResolvedValueOnce({}); // UPDATE successor
      mockClient.query.mockResolvedValueOnce({}); // DELETE doc
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient));

      await expect(deleteDocument(MOCK_USER_ID, MOCK_DOC_ID)).resolves.toBeUndefined();

      expect(mockClient.query).toHaveBeenNthCalledWith(
        2,
        'UPDATE documents SET successor_id = $1, updated_at = NOW() WHERE document_id = $2',
        ['succ-id', 'pred-id'],
      );
      expect(mockClient.query).toHaveBeenNthCalledWith(
        3,
        'UPDATE documents SET predecessor_id = $1, updated_at = NOW() WHERE document_id = $2',
        ['pred-id', 'succ-id'],
      );
      expect(mockClient.query).toHaveBeenNthCalledWith(
        4,
        'DELETE FROM documents WHERE document_id = $1',
        [MOCK_DOC_ID],
      );
    });

    it('clears successor on the predecessor when deleting the tail document', async () => {
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...MOCK_DOC, predecessor_id: 'pred-id', successor_id: null }],
      });
      mockClient.query.mockResolvedValueOnce({});
      mockClient.query.mockResolvedValueOnce({});
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient));

      await deleteDocument(MOCK_USER_ID, MOCK_DOC_ID);

      expect(mockClient.query).toHaveBeenNthCalledWith(
        2,
        'UPDATE documents SET successor_id = $1, updated_at = NOW() WHERE document_id = $2',
        [null, 'pred-id'],
      );
    });

    it('clears predecessor on the successor when deleting the head document', async () => {
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...MOCK_DOC, predecessor_id: null, successor_id: 'succ-id' }],
      });
      mockClient.query.mockResolvedValueOnce({});
      mockClient.query.mockResolvedValueOnce({});
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient));

      await deleteDocument(MOCK_USER_ID, MOCK_DOC_ID);

      expect(mockClient.query).toHaveBeenNthCalledWith(
        2,
        'UPDATE documents SET predecessor_id = $1, updated_at = NOW() WHERE document_id = $2',
        [null, 'succ-id'],
      );
    });

    it('only deletes when the document is a singleton (no neighbors)', async () => {
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({
        rows: [{ ...MOCK_DOC, predecessor_id: null, successor_id: null }],
      });
      mockClient.query.mockResolvedValueOnce({});
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient));

      await deleteDocument(MOCK_USER_ID, MOCK_DOC_ID);

      expect(mockClient.query).toHaveBeenCalledTimes(2);
      expect(mockClient.query).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM documents WHERE document_id = $1',
        [MOCK_DOC_ID],
      );
    });

    it('throws DocumentNotFoundError when no row matches the user/document pair', async () => {
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient));

      await expect(deleteDocument(MOCK_USER_ID, MOCK_DOC_ID)).rejects.toThrow(
        DocumentNotFoundError,
      );
    });
  }),
);

describe(
  'upsertDocument',
  mockClear(() => {
    it('should create a new document with a new cannon and story when no IDs are provided', async () => {
      const mockClient = createMockClient();
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient));
      mockClient.query.mockResolvedValueOnce({ rows: [{ cannon_id: MOCK_CANNON_ID }] }); // INSERT cannon
      mockClient.query.mockResolvedValueOnce({ rows: [{ story_id: MOCK_STORY_ID }] }); // INSERT story
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // SELECT predecessor
      mockClient.query.mockResolvedValueOnce({ rows: [{ document_id: MOCK_DOC_ID }] }); // INSERT document
      mockClient.query.mockResolvedValueOnce({}); // INSERT document_content
      mockFetchCannon.mockResolvedValueOnce(MOCK_CANNON_RESPONSE);

      expect(await upsertDocument(MOCK_USER_ID, { title: 'Chapter 1', body: 'Content' })).toEqual(
        MOCK_CANNON_RESPONSE,
      );
      expect(mockFetchCannon).toHaveBeenCalledWith(MOCK_CANNON_ID);
    });

    it('should update an existing document when documentId is provided', async () => {
      const mockClient = createMockClient();
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient));
      mockClient.query
        .mockResolvedValueOnce({
          rows: [
            {
              ...MOCK_DOC,
              user_id: MOCK_USER_ID,
              cannon_id: MOCK_CANNON_ID,
            },
          ],
        })
        .mockResolvedValueOnce({}) // UPDATE documents
        .mockResolvedValueOnce({}); // UPSERT document_content
      mockFetchCannon.mockResolvedValueOnce(MOCK_CANNON_RESPONSE);

      const result = await upsertDocument(MOCK_USER_ID, {
        documentId: MOCK_DOC_ID,
        title: 'Updated Chapter',
        body: 'Updated content',
      });

      expect(result).toEqual(MOCK_CANNON_RESPONSE);
      expect(mockFetchCannon).toHaveBeenCalledWith(MOCK_CANNON_ID);
      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE documents SET title = $1, updated_at = NOW() WHERE document_id = $2',
        ['Updated Chapter', MOCK_DOC_ID],
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO document_content'),
        [MOCK_DOC_ID, expect.any(Buffer)],
      );
    });

    it('throw DocumentNotFoundError error if provided documentId do not exist in the database', async () => {
      const mockClient = createMockClient();
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient));
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // Get document, story, and cannon for documentId

      await expect(
        upsertDocument(MOCK_USER_ID, {
          title: 'Chapter 1',
          body: 'Content',
          documentId: MOCK_DOC_ID,
        }),
      ).rejects.toThrow(DocumentNotFoundError);
    });

    it('throw StoryNotFoundError when storyId does not exist', async () => {
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient as any));
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        upsertDocument(MOCK_USER_ID, { title: 'Chapter 1', body: '', storyId: MOCK_STORY_ID }),
      ).rejects.toThrow(StoryNotFoundError);

      expect(mockFetchCannon).not.toHaveBeenCalled();
    });
  }),
);
