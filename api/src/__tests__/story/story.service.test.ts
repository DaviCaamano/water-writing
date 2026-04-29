import { MOCK_GENRE, MOCK_GENRES, MOCK_USER_ID } from '#__tests__/constants/mock-user';

jest.mock('#utils/database/with-transaction');
jest.mock('#utils/database/with-query');

import * as storyService from '#services/story/story.service';
import { withTransaction } from '#utils/database/with-transaction';
import { withQuery } from '#utils/database/with-query';
import {
  MOCK_STORY_ID,
  MOCK_WORLD_ID,
  MOCK_DOC,
  mockPool,
  MOCK_STORY,
  MOCK_STORY_RESPONSE,
} from '#__tests__/constants/mock-story';
import { createMockClient } from '#__tests__/constants/mock-database';
import { PoolClient } from 'pg';
import { mockClear } from '#__tests__/utils/test-wrappers';
import { StoryNotFoundError, WorldNotFoundError } from '#constants/error/custom-errors';
import { deleteStory, upsertGenre } from '#services/story/story.service';

const mockWithTransaction = withTransaction as jest.MockedFunction<typeof withTransaction>;
const mockWithQuery = withQuery as jest.MockedFunction<typeof withQuery>;

describe(
  'fetchStory',
  mockClear(() => {
    it('should fetch a story by its ID', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [MOCK_STORY] });
      expect(await storyService.fetchStory(MOCK_STORY_ID)).toEqual(MOCK_STORY);
    });

    it('throw StoryNotFoundError error when the story is not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      await expect(storyService.fetchStory(MOCK_STORY_ID)).rejects.toThrow(StoryNotFoundError);
    });
  }),
);

describe(
  'fetchStoryWithDocuments',
  mockClear(() => {
    it('should return a story with its documents', async () => {
      const storyWithDocs = { ...MOCK_STORY, documents: [MOCK_DOC] };
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({ rows: [storyWithDocs] });
      mockWithQuery.mockImplementation((callback) => callback(mockClient as PoolClient));

      const result = await storyService.fetchStoryWithDocuments(MOCK_STORY_ID);
      expect(result).toEqual(storyWithDocs);
    });

    it('throw StoryNotFoundError error when the story is not found', async () => {
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      mockWithQuery.mockImplementation((callback) => callback(mockClient as PoolClient));

      await expect(storyService.fetchStoryWithDocuments(MOCK_STORY_ID)).rejects.toThrow(
        StoryNotFoundError,
      );
    });
  }),
);

describe(
  'upsertStory',
  mockClear(() => {
    it('should create a new story with a new world when neither storyId nor worldId is provided', async () => {
      mockWithTransaction.mockImplementation((callback) => callback(mockTransactionClient));

      const mockTransactionClient = createMockClient();
      mockTransactionClient.query.mockResolvedValueOnce({ rows: [{ world_id: MOCK_WORLD_ID }] }); // INSERT world
      mockTransactionClient.query.mockResolvedValueOnce({ rows: [{ story_id: MOCK_STORY_ID }] }); // INSERT story

      jest.spyOn(storyService, 'fetchStory').mockImplementationOnce(async () => ({
        ...MOCK_STORY,
        documents: [],
      }));

      const result = await storyService.upsertStory(MOCK_USER_ID, { title: 'New Story' });
      expect(result).toEqual(MOCK_STORY_RESPONSE);
    });

    it('should update an existing story when storyId is provided', async () => {
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({ rows: [{ ...MOCK_STORY, title: 'Old Story' }] }); // SELECT existing story
      mockClient.query.mockResolvedValueOnce({}); // UPDATE
      mockWithTransaction.mockImplementation((callback) => callback(mockClient));

      jest.spyOn(storyService, 'fetchStory').mockImplementationOnce(async () => ({
        ...MOCK_STORY,
        title: 'Updated Story',
        documents: [],
      }));

      const result = await storyService.upsertStory(MOCK_USER_ID, {
        storyId: MOCK_STORY_ID,
        title: 'Updated Story',
      });
      expect(result).toEqual({ ...MOCK_STORY_RESPONSE, title: 'Updated Story' });
    });

    it('throw StoryNotFoundError when provided story does not exist in database', async () => {
      mockWithTransaction.mockImplementation((callback) => callback(mockedClient));
      const mockedClient = createMockClient();
      mockedClient.query.mockResolvedValueOnce({ rows: [] }); // worldCheck fails

      await expect(
        storyService.upsertStory(MOCK_USER_ID, {
          title: 'New Story',
          storyId: MOCK_STORY_ID,
          worldId: MOCK_WORLD_ID,
        }),
      ).rejects.toThrow(StoryNotFoundError);
    });

    it('throw WorldNotFoundError when provided world does not exist in database', async () => {
      const mockedClient = createMockClient();
      mockedClient.query.mockResolvedValueOnce({ rows: [] }); // worldCheck fails
      mockWithTransaction.mockImplementation((callback) => callback(mockedClient));

      await expect(
        storyService.upsertStory(MOCK_USER_ID, { title: 'New Story', worldId: MOCK_WORLD_ID }),
      ).rejects.toThrow(WorldNotFoundError);
    });

    it('throw WorldNotFoundError when story is not currently assigned to worldId and world does not exist in database', async () => {
      mockWithTransaction.mockImplementation((callback) => callback(mockedClient));
      const mockedClient = createMockClient();
      mockedClient.query.mockResolvedValueOnce({
        rows: [{ ...MOCK_STORY, user_id: MOCK_USER_ID, world_id: MOCK_WORLD_ID + '-different' }],
      }); // SELECT STORY
      mockedClient.query.mockResolvedValueOnce({ rows: [] }); // SELECT WORLD

      await expect(
        storyService.upsertStory(MOCK_USER_ID, {
          title: MOCK_STORY.title,
          storyId: MOCK_STORY_ID,
          worldId: MOCK_WORLD_ID,
        }),
      ).rejects.toThrow(WorldNotFoundError);
    });
  }),
);

describe(
  'deleteStory',
  mockClear(() => {
    it('deletes the story when it belongs to the user', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      await expect(deleteStory(MOCK_USER_ID, MOCK_STORY_ID)).resolves.toBeUndefined();
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM stories'), [
        MOCK_STORY_ID,
        MOCK_USER_ID,
      ]);
    });

    it('throws StoryNotFoundError when no row is deleted', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      await expect(deleteStory(MOCK_USER_ID, MOCK_STORY_ID)).rejects.toThrow(StoryNotFoundError);
    });
  }),
);

describe(
  'fetchUserStories',
  mockClear(() => {
    it('returns stories with their documents grouped by story_id', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [MOCK_STORY] })
        .mockResolvedValueOnce({ rows: [MOCK_DOC] });

      const result = await storyService.fetchUserStories(MOCK_USER_ID);

      expect(result).toEqual([
        {
          ...MOCK_STORY_RESPONSE,
          documents: [
            {
              documentId: MOCK_DOC.document_id,
              storyId: MOCK_DOC.story_id,
              title: MOCK_DOC.title,
              body: MOCK_DOC.body,
              predecessorId: MOCK_DOC.predecessor_id,
              successorId: MOCK_DOC.successor_id,
              createdAt: MOCK_DOC.created_at,
              updatedAt: MOCK_DOC.updated_at,
            },
          ],
        },
      ]);
      expect(mockPool.query).toHaveBeenNthCalledWith(1, expect.stringContaining('FROM stories'), [
        MOCK_USER_ID,
      ]);
      expect(mockPool.query).toHaveBeenNthCalledWith(2, expect.stringContaining('FROM documents'), [
        [MOCK_STORY_ID],
      ]);
    });

    it('returns an empty array when the user has no stories', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await storyService.fetchUserStories(MOCK_USER_ID);

      expect(result).toEqual([]);
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  }),
);

describe(
  'user service: addGenres',
  mockClear(() => {
    it('should add genres to a user', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [MOCK_GENRE] });
      mockWithQuery.mockImplementation((callback) => callback(mockClient as PoolClient));
      await expect(upsertGenre(MOCK_USER_ID, MOCK_GENRES)).resolves.not.toThrow();
    });
  }),
);
