jest.mock('#utils/compression', () => ({
  decompressBody: async (buf: unknown) => (typeof buf === 'string' ? buf : String(buf)),
  compressBody: async (text: string) => Buffer.from(text),
}));
jest.mock('#utils/database/with-transaction');

import {
  MOCK_DOC_ID,
  MOCK_STORY_ID,
  MOCK_CANNON_ID,
  MOCK_CANNON_RESPONSE,
  MOCK_CANNON,
  MOCK_STORY,
  MOCK_DOC,
} from '#__tests__/constants/mock-story';

import { CannonNotFoundError } from '#constants/error/custom-errors';
import {
  CannonRowWithStories,
  DecompressedDocumentRow,
  StoryRow,
  StoryRowWithDocuments,
} from '#types/database';
import { mockPool, createMockClient } from '#__tests__/constants/mock-database';
import { MOCK_DATE } from '#__tests__/constants/mock-basic';
import { mockClear } from '#__tests__/utils/test-wrappers';
import { withTransaction } from '#utils/database/with-transaction';

import * as cannonService from '#services/story/cannon.service';
import { DocType, checkLegacyStructure, mockLegacy } from '#__tests__/utils/mock-linked-documents';
import { deleteCannon, fetchCannon, fetchLegacy } from '#services/story/cannon.service';
import { MOCK_USER_ID } from '#__tests__/constants/mock-user';

const mockWithTransaction = withTransaction as jest.MockedFunction<typeof withTransaction>;

describe(
  'upsertCannon',
  mockClear(() => {
    it('should insert a new cannon when no cannonId is provided', async () => {
      const mockFetch = jest.fn().mockResolvedValueOnce(MOCK_CANNON_RESPONSE);
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({ rows: [{ cannon_id: MOCK_CANNON_ID }] }); // INSERT cannons
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient));

      const result = await cannonService.upsertCannon(
        MOCK_USER_ID,
        { title: 'Test Cannon' },
        mockFetch,
      );
      expect(mockFetch).toHaveBeenCalledWith(MOCK_CANNON_ID, undefined, mockClient);
      expect(result).toEqual(MOCK_CANNON_RESPONSE);
    });

    it('should update a cannon when cannonId is provided and exists', async () => {
      const updatedResponse = { ...MOCK_CANNON_RESPONSE, title: 'Updated Cannon' };
      const mockFetch = jest.fn().mockResolvedValueOnce(updatedResponse);
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({ rows: [{}] }) // SELECT 1 (ownership check)
        .mockResolvedValueOnce({}); // UPDATE cannons
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient));

      const result = await cannonService.upsertCannon(
        MOCK_USER_ID,
        { cannonId: MOCK_CANNON_ID, title: 'Updated Cannon' },
        mockFetch,
      );

      expect(mockFetch).toHaveBeenCalledWith(MOCK_CANNON_ID, undefined, mockClient);
      expect(result).toEqual(updatedResponse);
    });

    it('throw CannonNotFoundError when cannonId does not exist', async () => {
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient));

      await expect(
        cannonService.upsertCannon(MOCK_USER_ID, {
          cannonId: MOCK_CANNON_ID,
          title: 'Updated Cannon',
        }),
      ).rejects.toThrow(CannonNotFoundError);
    });
  }),
);

describe(
  'fetchCannon',
  mockClear(() => {
    it('should throw CannonNotFoundError when the cannon does not exist', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // SELECT cannons
        .mockResolvedValueOnce({ rows: [] }); // SELECT stories (parallel)

      await expect(cannonService.fetchCannon(MOCK_CANNON_ID)).rejects.toThrow(CannonNotFoundError);
    });

    it('should return the cannon with nested stories and documents', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [MOCK_CANNON] })
        .mockResolvedValueOnce({ rows: [MOCK_STORY] })
        .mockResolvedValueOnce({ rows: [MOCK_DOC] });

      const result = await cannonService.fetchCannon(MOCK_CANNON_ID);

      expect(result).toEqual({
        cannonId: MOCK_CANNON_ID,
        userId: MOCK_USER_ID,
        title: 'Test Cannon',
        stories: [
          {
            storyId: MOCK_STORY_ID,
            cannonId: MOCK_CANNON_ID,
            title: 'Test Story',
            predecessorId: null,
            successorId: null,
            documents: [
              {
                documentId: MOCK_DOC_ID,
                storyId: MOCK_STORY_ID,
                title: 'Test Document',
                body: 'Test content',
                predecessorId: null,
                successorId: null,
                createdAt: MOCK_DATE,
                updatedAt: MOCK_DATE,
              },
            ],
            createdAt: MOCK_DATE,
            updatedAt: MOCK_DATE,
          },
        ],
        createdAt: MOCK_DATE,
        updatedAt: MOCK_DATE,
      });
    });

    it('should return a mapped cannon with no stories', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [MOCK_CANNON] }) // SELECT cannons
        .mockResolvedValueOnce({ rows: [] }); // SELECT stories

      const result = await cannonService.fetchCannon(MOCK_CANNON_ID);
      expect(result).toEqual(MOCK_CANNON_RESPONSE);
    });

    it('should map predecessor and successor IDs correctly', async () => {
      const cannons: CannonRowWithStories[] = mockLegacy([
        [3, 7, 1, 4],
        [0, 5, 9, 2, 6],
        [8, 1, 3],
        [4, 6, 0, 7, 2],
        [9, 3, 5, 1],
      ]);

      // fetchCannon handles one cannon at a time - provide only the first cannon's stories/docs
      const singleCannon = cannons[0]!;
      const cannonList = [{ ...singleCannon, stories: undefined }];
      const storyList = (singleCannon.stories as StoryRowWithDocuments[]).map(
        ({ documents: _, ...story }) => story,
      );
      const documentList = (singleCannon.stories as StoryRowWithDocuments[]).reduce<
        DecompressedDocumentRow[]
      >((acc, story) => [...acc, ...story.documents], []);

      mockPool.query
        .mockResolvedValueOnce({ rows: cannonList })
        .mockResolvedValueOnce({ rows: storyList })
        .mockResolvedValueOnce({ rows: documentList });

      const result = await cannonService.fetchCannon(MOCK_CANNON_ID);
      expect(result).not.toBeNull();
      expect(checkLegacyStructure([result!], DocType.cannonResponse)).toBe(true);
    });
  }),
);

describe(
  'fetchCannon (with userId)',
  mockClear(() => {
    it('returns the cannon when it belongs to the authenticated user', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [MOCK_CANNON] })
        .mockResolvedValueOnce({ rows: [MOCK_STORY] })
        .mockResolvedValueOnce({ rows: [MOCK_DOC] });

      await expect(fetchCannon(MOCK_CANNON_ID, MOCK_USER_ID)).resolves.toMatchObject({
        cannonId: MOCK_CANNON_ID,
        userId: MOCK_USER_ID,
      });
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [
        MOCK_CANNON_ID,
        MOCK_USER_ID,
      ]);
    });

    it('throws CannonNotFoundError when the cannon is missing or owned by another user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });

      await expect(fetchCannon(MOCK_CANNON_ID, MOCK_USER_ID)).rejects.toThrow(CannonNotFoundError);
    });
  }),
);

describe(
  'deleteCannon',
  mockClear(() => {
    it('deletes the cannon when it belongs to the user', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      await expect(deleteCannon(MOCK_USER_ID, MOCK_CANNON_ID)).resolves.toBeUndefined();
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [
        MOCK_CANNON_ID,
        MOCK_USER_ID,
      ]);
    });

    it('throws CannonNotFoundError when no row is deleted', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      await expect(deleteCannon(MOCK_USER_ID, MOCK_CANNON_ID)).rejects.toThrow(CannonNotFoundError);
    });
  }),
);

describe(
  'fetchLegacy',
  mockClear(() => {
    it('should return an empty array when user has no cannons', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // SELECT cannons
        .mockResolvedValueOnce({ rows: [] }); // SELECT stories (parallel)
      expect(await fetchLegacy(MOCK_USER_ID)).toEqual([]);
    });

    it('should return cannons with nested stories and documents', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [MOCK_CANNON] })
        .mockResolvedValueOnce({ rows: [MOCK_STORY] })
        .mockResolvedValueOnce({ rows: [MOCK_DOC] });

      const result = await fetchLegacy(MOCK_USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        cannonId: MOCK_CANNON_ID,
        userId: MOCK_USER_ID,
        title: 'Test Cannon',
        stories: [
          {
            storyId: MOCK_STORY_ID,
            cannonId: MOCK_CANNON_ID,
            title: 'Test Story',
            predecessorId: null,
            successorId: null,
            documents: [
              {
                documentId: MOCK_DOC_ID,
                storyId: MOCK_STORY_ID,
                title: 'Test Document',
                body: 'Test content',
                predecessorId: null,
                successorId: null,
                createdAt: MOCK_DATE,
                updatedAt: MOCK_DATE,
              },
            ],
            createdAt: MOCK_DATE,
            updatedAt: MOCK_DATE,
          },
        ],
        createdAt: MOCK_DATE,
        updatedAt: MOCK_DATE,
      });
    });

    it('should group stories and documents under the correct cannon', async () => {
      const cannons = mockLegacy([
        [2, 0],
        [3, 1, 4],
      ]);

      const cannonList = cannons.map((cannon) => ({ ...cannon, stories: undefined }));
      const storyList = cannons.reduce<StoryRow[]>(
        (acc, cannon) => [
          ...acc,
          ...(cannon.stories as StoryRowWithDocuments[]).map(({ documents: _, ...story }) => story),
        ],
        [],
      );
      const documentList = cannons
        .reduce<
          StoryRowWithDocuments[]
        >((acc, cannon) => [...acc, ...(cannon.stories as StoryRowWithDocuments[])], [])
        .reduce<DecompressedDocumentRow[]>((acc, story) => [...acc, ...story.documents], []);

      mockPool.query
        .mockResolvedValueOnce({ rows: cannonList })
        .mockResolvedValueOnce({ rows: storyList })
        .mockResolvedValueOnce({ rows: documentList });

      const result = await fetchLegacy(MOCK_USER_ID);

      expect(result).toHaveLength(2);
      expect(result[0]!.stories).toHaveLength(2);
      expect(result[1]!.stories).toHaveLength(3);
      expect(checkLegacyStructure(result, DocType.cannonResponse)).toBe(true);
    });

    it('should skip the documents query when there are no stories', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [MOCK_CANNON] })
        .mockResolvedValueOnce({ rows: [] }); // no stories - documents query should NOT fire

      const result = await fetchLegacy(MOCK_USER_ID);

      expect(result[0]!.stories).toEqual([]);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
  }),
);
