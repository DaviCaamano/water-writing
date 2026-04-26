import { StoryNotFoundError, WorldNotFoundError } from '#constants/error/custom-errors';

jest.mock('#services/story/story.service');
jest.mock('#services/story/document.service');
jest.mock('#services/story/world.service');
jest.mock('#config/stripe', () => ({ __esModule: true, default: {} }));

import request from 'supertest';
import app from '#app';
import * as documentService from '#services/story/document.service';
import * as storyService from '#services/story/story.service';
import * as worldService from '#services/story/world.service';
import { mockAuthHeaders } from '#__tests__/constants/mock-auth-headers';
import { mockClear, testAuth } from '#__tests__/utils/test-wrappers';
import {
  MOCK_DOC_ID,
  MOCK_DOCK_RESPONSE,
  MOCK_STORY,
  MOCK_STORY_RESPONSE,
  MOCK_WORLD_RESPONSE,
} from '#__tests__/constants/mock-story';
import { DocumentNotFoundError } from '#constants/error/custom-errors';

const mockUpsertDocument = documentService.upsertDocument as jest.Mock;
const mockFetchUserDocument = documentService.fetchUserDocument as jest.Mock;
const mockDeleteDocument = documentService.deleteDocument as jest.Mock;
const mockUpsertStory = storyService.upsertStory as jest.Mock;
const mockFetchUserStories = storyService.fetchUserStories as jest.Mock;
const mockFetchStoryWithDocuments = storyService.fetchStoryWithDocuments as jest.Mock;
const mockDeleteStory = storyService.deleteStory as jest.Mock;
const mockAddGenres = storyService.upsertGenre as jest.MockedFunction<typeof storyService.upsertGenre>;
const mockUpsertWorld = worldService.upsertWorld as jest.Mock;
const mockFetchWorld = worldService.fetchWorld as jest.Mock;
const mockFetchLegacy = worldService.fetchLegacy as jest.Mock;
const mockDeleteWorld = worldService.deleteWorld as jest.Mock;

const MOCK_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // must match MOCK_LOGIN_RESPONSE.userId
const MOCK_WORLD_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const MOCK_STORY_ID = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

describe(
  'POST /story/world',
  testAuth('/story/world', 'post', { title: 'My World' }, () => {
    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/story/world').set(mockAuthHeaders()).send({});
      expect(res.status).toBe(400);
      expect(res.body.details.properties).toHaveProperty('title');
    });

    it('returns 200 with world data on success', async () => {
      mockUpsertWorld.mockResolvedValueOnce(MOCK_WORLD_RESPONSE);

      const res = await request(app)
        .post('/story/world')
        .set(mockAuthHeaders())
        .send({ title: 'Test World' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ worldId: MOCK_WORLD_ID, title: 'Test World' });
      expect(mockUpsertWorld).toHaveBeenCalledWith(MOCK_USER_ID, { title: 'Test World' });
    });

    it('returns 404 when world is not found', async () => {
      mockUpsertWorld.mockRejectedValueOnce(new WorldNotFoundError());

      const res = await request(app)
        .post('/story/world')
        .set(mockAuthHeaders())
        .send({ worldId: MOCK_WORLD_ID, title: 'Updated World' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('World not found');
    });
  }),
);

describe(
  'POST /story/story',
  testAuth('/story/story', 'post', { title: 'New Story' }, () => {
    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/story/story').set(mockAuthHeaders()).send({});
      expect(res.status).toBe(400);
    });

    it('returns 200 with world data on success', async () => {
      mockUpsertStory.mockResolvedValueOnce(MOCK_WORLD_RESPONSE);

      const res = await request(app)
        .post('/story/story')
        .set(mockAuthHeaders())
        .send({ title: 'New Story' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ worldId: MOCK_WORLD_ID });
      expect(mockUpsertStory).toHaveBeenCalledWith(MOCK_USER_ID, { title: 'New Story' });
    });

    it('returns 404 when world is not found', async () => {
      mockUpsertStory.mockRejectedValueOnce(new WorldNotFoundError());

      const res = await request(app)
        .post('/story/story')
        .set(mockAuthHeaders())
        .send({ title: 'My Story', worldId: MOCK_WORLD_ID });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('World not found');
    });
  }),
);

describe(
  'POST /story/document',
  testAuth('/story/document', 'post', { title: 'Chapter 1' }, () => {
    it('returns 400 when title is missing', async () => {
      const res = await request(app)
        .post('/story/document')
        .set(mockAuthHeaders())
        .send({ body: 'content' });
      expect(res.status).toBe(400);
      expect(res.body.details.properties).toHaveProperty('title');
    });

    it('returns 200 with world data on success', async () => {
      mockUpsertDocument.mockResolvedValueOnce(MOCK_WORLD_RESPONSE);

      const res = await request(app)
        .post('/story/document')
        .set(mockAuthHeaders())
        .send({ title: 'Chapter 1' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ worldId: MOCK_WORLD_ID });
      expect(mockUpsertDocument).toHaveBeenCalledWith(MOCK_USER_ID, {
        title: 'Chapter 1',
        body: '',
      });
    });

    it('returns 404 when story is not found', async () => {
      mockUpsertDocument.mockRejectedValueOnce(new StoryNotFoundError());

      const res = await request(app)
        .post('/story/document')
        .set(mockAuthHeaders())
        .send({ title: 'Chapter 1', storyId: MOCK_STORY_ID });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Story not found');
    });
  }),
);

describe(
  'GET /story/stories',
  mockClear(() => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/story/stories');
      expect(res.status).toBe(401);
    });

    it('returns 200 with the list of user stories', async () => {
      mockFetchUserStories.mockResolvedValueOnce([MOCK_STORY_RESPONSE]);

      const res = await request(app).get('/story/stories').set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ storyId: MOCK_STORY_RESPONSE.storyId });
      expect(mockFetchUserStories).toHaveBeenCalledWith(MOCK_USER_ID);
    });
  }),
);

describe(
  'GET /story/document/:documentId',
  mockClear(() => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/story/document/${MOCK_DOC_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 400 when documentId is not a valid UUID', async () => {
      const res = await request(app).get('/story/document/not-a-uuid').set(mockAuthHeaders());
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid path parameters');
    });

    it('returns 200 with the document on success', async () => {
      mockFetchUserDocument.mockResolvedValueOnce(MOCK_DOCK_RESPONSE);

      const res = await request(app).get(`/story/document/${MOCK_DOC_ID}`).set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ documentId: MOCK_DOC_ID });
      expect(mockFetchUserDocument).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_DOC_ID);
    });

    it('returns 404 when the document is not found', async () => {
      mockFetchUserDocument.mockRejectedValueOnce(new DocumentNotFoundError());

      const res = await request(app).get(`/story/document/${MOCK_DOC_ID}`).set(mockAuthHeaders());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Document not found');
    });
  }),
);

describe(
  'GET /story/story/:storyId',
  mockClear(() => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/story/story/${MOCK_STORY_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 400 when storyId is not a valid UUID', async () => {
      const res = await request(app).get('/story/story/not-a-uuid').set(mockAuthHeaders());
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid path parameters');
    });

    it('returns 200 with the mapped story on success', async () => {
      mockFetchStoryWithDocuments.mockResolvedValueOnce({ ...MOCK_STORY, documents: [] });

      const res = await request(app).get(`/story/story/${MOCK_STORY_ID}`).set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ storyId: MOCK_STORY_ID, worldId: MOCK_WORLD_ID });
      expect(mockFetchStoryWithDocuments).toHaveBeenCalledWith(MOCK_STORY_ID);
    });

    it('returns 404 when the story is not found', async () => {
      mockFetchStoryWithDocuments.mockRejectedValueOnce(new StoryNotFoundError());

      const res = await request(app).get(`/story/story/${MOCK_STORY_ID}`).set(mockAuthHeaders());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Story not found');
    });
  }),
);

describe(
  'GET /story/world/:worldId',
  mockClear(() => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/story/world/${MOCK_WORLD_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 400 when worldId is not a valid UUID', async () => {
      const res = await request(app).get('/story/world/not-a-uuid').set(mockAuthHeaders());
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid path parameters');
    });

    it('returns 200 with the world on success', async () => {
      mockFetchWorld.mockResolvedValueOnce(MOCK_WORLD_RESPONSE);

      const res = await request(app).get(`/story/world/${MOCK_WORLD_ID}`).set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ worldId: MOCK_WORLD_ID, title: 'Test World' });
      expect(mockFetchWorld).toHaveBeenCalledWith(MOCK_WORLD_ID);
    });

    it('returns 404 when the world is not found', async () => {
      mockFetchWorld.mockRejectedValueOnce(new WorldNotFoundError());

      const res = await request(app).get(`/story/world/${MOCK_WORLD_ID}`).set(mockAuthHeaders());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Story not found');
    });
  }),
);

describe(
  'GET /story/legacy',
  mockClear(() => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/story/legacy');
      expect(res.status).toBe(401);
    });

    it('returns 200 with the list of worlds for the user', async () => {
      mockFetchLegacy.mockResolvedValueOnce([MOCK_WORLD_RESPONSE]);

      const res = await request(app).get('/story/legacy').set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ worldId: MOCK_WORLD_ID });
      expect(mockFetchLegacy).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('returns 200 with an empty array when user has no worlds', async () => {
      mockFetchLegacy.mockResolvedValueOnce([]);

      const res = await request(app).get('/story/legacy').set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  }),
);

describe(
  'DELETE /story/world/:worldId',
  mockClear(() => {
    it('returns 401 without auth', async () => {
      const res = await request(app).delete(`/story/world/${MOCK_WORLD_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 400 when worldId is not a valid UUID', async () => {
      const res = await request(app).delete('/story/world/not-a-uuid').set(mockAuthHeaders());
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid path parameters');
    });

    it('returns 200 on success', async () => {
      mockDeleteWorld.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .delete(`/story/world/${MOCK_WORLD_ID}`)
        .set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
      expect(mockDeleteWorld).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_WORLD_ID);
    });

    it('returns 404 when the world is not found', async () => {
      mockDeleteWorld.mockRejectedValueOnce(new WorldNotFoundError());

      const res = await request(app)
        .delete(`/story/world/${MOCK_WORLD_ID}`)
        .set(mockAuthHeaders());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('World not found');
    });
  }),
);

describe(
  'DELETE /story/story/:storyId',
  mockClear(() => {
    it('returns 401 without auth', async () => {
      const res = await request(app).delete(`/story/story/${MOCK_STORY_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 400 when storyId is not a valid UUID', async () => {
      const res = await request(app).delete('/story/story/not-a-uuid').set(mockAuthHeaders());
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid path parameters');
    });

    it('returns 200 on success', async () => {
      mockDeleteStory.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .delete(`/story/story/${MOCK_STORY_ID}`)
        .set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
      expect(mockDeleteStory).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_STORY_ID);
    });

    it('returns 404 when the story is not found', async () => {
      mockDeleteStory.mockRejectedValueOnce(new StoryNotFoundError());

      const res = await request(app)
        .delete(`/story/story/${MOCK_STORY_ID}`)
        .set(mockAuthHeaders());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Story not found');
    });
  }),
);

describe(
  'DELETE /story/document/:documentId',
  mockClear(() => {
    it('returns 401 without auth', async () => {
      const res = await request(app).delete(`/story/document/${MOCK_DOC_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 400 when documentId is not a valid UUID', async () => {
      const res = await request(app).delete('/story/document/not-a-uuid').set(mockAuthHeaders());
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid path parameters');
    });

    it('returns 200 on success', async () => {
      mockDeleteDocument.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .delete(`/story/document/${MOCK_DOC_ID}`)
        .set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
      expect(mockDeleteDocument).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_DOC_ID);
    });

    it('returns 404 when the document is not found', async () => {
      mockDeleteDocument.mockRejectedValueOnce(new DocumentNotFoundError());

      const res = await request(app)
        .delete(`/story/document/${MOCK_DOC_ID}`)
        .set(mockAuthHeaders());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Document not found');
    });
  }),
);

// POST /story/genre
describe(
  'POST /story/genres',
  testAuth('/story/genre', 'post', { genres: 'Fantasy' }, () => {
    it('returns 400 when genres is not an array', async () => {
      const res = await request(app)
        .post('/story/genre')
        .set(mockAuthHeaders())
        .send({ genres: 'Fantasy' });
      expect(res.status).toBe(400);
      expect(res.body.details.properties).toHaveProperty('genres');
    });

    it('returns 200 with updated genre list', async () => {
      const headers = mockAuthHeaders();
      mockAddGenres.mockResolvedValueOnce(['Fantasy', 'Sci-Fi']);

      const res = await request(app)
        .post('/story/genre')
        .set(headers)
        .send({ story_id: MOCK_STORY_ID, genres: ['Fantasy', 'Sci-Fi'] });

      expect(res.status).toBe(200);
      expect(res.body.genres).toEqual(['Fantasy', 'Sci-Fi']);
    });
  }),
);
