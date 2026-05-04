import { MOCK_GENRES, MOCK_USER_ID } from '#__tests__/constants/mock-user';

jest.mock('#utils/database/with-transaction');
jest.mock('#utils/database/with-query');

import * as storyService from '#services/story/story.service';
import { withTransaction } from '#utils/database/with-transaction';
import { withQuery } from '#utils/database/with-query';
import {
  MOCK_STORY_ID,
  MOCK_CANNON_ID,
  MOCK_DOC,
  mockPool,
  MOCK_STORY,
  MOCK_STORY_RESPONSE,
} from '#__tests__/constants/mock-story';
import { createMockClient } from '#__tests__/constants/mock-database';
import { PoolClient } from 'pg';
import { mockClear } from '#__tests__/utils/test-wrappers';
import { StoryNotFoundError, CannonNotFoundError } from '#constants/error/custom-errors';
import { deleteStory, upsertGenre } from '#services/story/story.service';

const mockWithTransaction = withTransaction as jest.MockedFunction<typeof withTransaction>;
const mockWithQuery = withQuery as jest.MockedFunction<typeof withQuery>;

describe(
  'fetchStory',
  mockClear(() => {
    it('returns a story row for a known story id', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [MOCK_STORY] });

      await expect(storyService.fetchStory(MOCK_STORY_ID)).resolves.toEqual(MOCK_STORY);
    });

    it('throws StoryNotFoundError when the story does not exist', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(storyService.fetchStory(MOCK_STORY_ID)).rejects.toThrow(StoryNotFoundError);
    });
  }),
);

describe(
  'fetchStoryWithDocuments',
  mockClear(() => {
    it('returns a story with its documents', async () => {
      const storyWithDocs = { ...MOCK_STORY, documents: [MOCK_DOC] };
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({ rows: [storyWithDocs] });
      mockWithQuery.mockImplementation((callback) => callback(mockClient as PoolClient));

      await expect(storyService.fetchStoryWithDocuments(MOCK_STORY_ID)).resolves.toEqual(
        storyWithDocs,
      );
    });

    it('throws StoryNotFoundError when no story row is returned', async () => {
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
  'fetchUserStoryWithDocuments',
  mockClear(() => {
    it('returns the story when it belongs to the authenticated user', async () => {
      const storyWithDocs = { ...MOCK_STORY, documents: [MOCK_DOC] };
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({ rows: [storyWithDocs] });
      mockWithQuery.mockImplementation((callback) => callback(mockClient as PoolClient));

      await expect(
        storyService.fetchUserStoryWithDocuments(MOCK_USER_ID, MOCK_STORY_ID),
      ).resolves.toEqual(storyWithDocs);
      expect(mockClient.query).toHaveBeenCalledWith(expect.any(String), [MOCK_STORY_ID, MOCK_USER_ID]);
    });

    it('throws StoryNotFoundError when the story is missing or not owned by the user', async () => {
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      mockWithQuery.mockImplementation((callback) => callback(mockClient as PoolClient));

      await expect(
        storyService.fetchUserStoryWithDocuments(MOCK_USER_ID, MOCK_STORY_ID),
      ).rejects.toThrow(StoryNotFoundError);
    });
  }),
);

describe(
  'upsertStory',
  mockClear(() => {
    it('creates a new story and fetches it after the transaction commits', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ cannon_id: MOCK_CANNON_ID }] })
        .mockResolvedValueOnce({ rows: [{ story_id: MOCK_STORY_ID }] });
      mockWithTransaction.mockImplementation((callback) => callback(mockClient));

      const fetchSpy = jest
        .spyOn(storyService, 'fetchStoryWithDocuments')
        .mockResolvedValueOnce({ ...MOCK_STORY, documents: [] });

      await expect(storyService.upsertStory(MOCK_USER_ID, { title: 'New Story' })).resolves.toEqual(
        MOCK_STORY_RESPONSE,
      );
      expect(fetchSpy).toHaveBeenCalledWith(MOCK_STORY_ID);
    });

    it('updates an existing story and returns the refreshed response', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ ...MOCK_STORY, title: 'Old Story', user_id: MOCK_USER_ID }] })
        .mockResolvedValueOnce({});
      mockWithTransaction.mockImplementation((callback) => callback(mockClient));

      jest.spyOn(storyService, 'fetchStoryWithDocuments').mockResolvedValueOnce({
        ...MOCK_STORY,
        title: 'Updated Story',
        documents: [],
      });

      await expect(
        storyService.upsertStory(MOCK_USER_ID, {
          storyId: MOCK_STORY_ID,
          title: 'Updated Story',
        }),
      ).resolves.toEqual({ ...MOCK_STORY_RESPONSE, title: 'Updated Story' });
    });

    it('throws StoryNotFoundError when updating a story that is not owned by the user', async () => {
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      mockWithTransaction.mockImplementation((callback) => callback(mockClient));

      await expect(
        storyService.upsertStory(MOCK_USER_ID, {
          title: 'New Story',
          storyId: MOCK_STORY_ID,
        }),
      ).rejects.toThrow(StoryNotFoundError);
    });

    it('throws CannonNotFoundError when creating into a missing cannon', async () => {
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      mockWithTransaction.mockImplementation((callback) => callback(mockClient));

      await expect(
        storyService.upsertStory(MOCK_USER_ID, { title: 'New Story', cannonId: MOCK_CANNON_ID }),
      ).rejects.toThrow(CannonNotFoundError);
    });

    it('throws CannonNotFoundError when moving a story into a cannon the user does not own', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ ...MOCK_STORY, user_id: MOCK_USER_ID, cannon_id: `${MOCK_CANNON_ID}-other` }],
        })
        .mockResolvedValueOnce({ rows: [] });
      mockWithTransaction.mockImplementation((callback) => callback(mockClient));

      await expect(
        storyService.upsertStory(MOCK_USER_ID, {
          title: MOCK_STORY.title,
          storyId: MOCK_STORY_ID,
          cannonId: MOCK_CANNON_ID,
        }),
      ).rejects.toThrow(CannonNotFoundError);
    });
  }),
);

describe(
  'deleteStory',
  mockClear(() => {
    it('deletes the story when it belongs to the user', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      await expect(deleteStory(MOCK_USER_ID, MOCK_STORY_ID)).resolves.toBeUndefined();
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [MOCK_STORY_ID, MOCK_USER_ID]);
    });

    it('throws StoryNotFoundError when nothing is deleted', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      await expect(deleteStory(MOCK_USER_ID, MOCK_STORY_ID)).rejects.toThrow(StoryNotFoundError);
    });
  }),
);

describe(
  'fetchUserStories',
  mockClear(() => {
    it('returns stories with their documents grouped by story id', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [MOCK_STORY] })
        .mockResolvedValueOnce({ rows: [MOCK_DOC] });

      await expect(storyService.fetchUserStories(MOCK_USER_ID)).resolves.toEqual([
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
    });

    it('returns an empty array when the user has no stories', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(storyService.fetchUserStories(MOCK_USER_ID)).resolves.toEqual([]);
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  }),
);

describe(
  'upsertGenre',
  mockClear(() => {
    it('adds genres for a story owned by the user and returns the sorted list', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({ rows: [{}] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          rows: [{ genre: 'fantasy' }, { genre: 'horror' }],
        });
      mockWithQuery.mockImplementation((callback) => callback(mockClient as PoolClient));

      await expect(upsertGenre(MOCK_USER_ID, MOCK_STORY_ID, MOCK_GENRES)).resolves.toEqual(
        MOCK_GENRES,
      );
      expect(mockClient.query).toHaveBeenCalledWith(expect.any(String), [MOCK_STORY_ID, MOCK_USER_ID]);
    });

    it('throws StoryNotFoundError when the story is missing or not owned by the user', async () => {
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      mockWithQuery.mockImplementation((callback) => callback(mockClient as PoolClient));

      await expect(upsertGenre(MOCK_USER_ID, MOCK_STORY_ID, MOCK_GENRES)).rejects.toThrow(
        StoryNotFoundError,
      );
    });
  }),
);
