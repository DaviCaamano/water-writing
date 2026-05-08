import { StoryNotFoundError, CannonNotFoundError } from '#constants/error/custom-errors';

jest.mock('#services/story/story.service');
jest.mock('#services/story/document.service');
jest.mock('#services/story/cannon.service');
jest.mock('#config/stripe', () => ({ __esModule: true, default: {} }));

import request from 'supertest';
import app from '#app';
import * as documentService from '#services/story/document.service';
import * as storyService from '#services/story/story.service';
import * as cannonService from '#services/story/cannon.service';
import { mockAuthHeaders } from '#__tests__/constants/mock-auth-headers';
import { mockClear, testAuth } from '#__tests__/utils/test-wrappers';
import {
  MOCK_CANNON_ID,
  MOCK_DOC_ID,
  MOCK_DOC_RESPONSE,
  MOCK_STORY,
  MOCK_STORY_ID,
  MOCK_STORY_RESPONSE,
  MOCK_CANNON_RESPONSE,
} from '#__tests__/constants/mock-story';
import { MOCK_USER_ID } from '#__tests__/constants/mock-ids';
import { DocumentNotFoundError } from '#constants/error/custom-errors';

const mockUpsertDocument = documentService.upsertDocument as jest.Mock;
const mockFetchUserDocument = documentService.fetchUserDocument as jest.Mock;
const mockDeleteDocument = documentService.deleteDocument as jest.Mock;
const mockUpsertStory = storyService.upsertStory as jest.Mock;
const mockFetchUserStories = storyService.fetchUserStories as jest.Mock;
const mockFetchUserStoryWithDocuments = storyService.fetchUserStoryWithDocuments as jest.Mock;
const mockDeleteStory = storyService.deleteStory as jest.Mock;
const mockAddGenres = storyService.upsertGenre as jest.MockedFunction<
  typeof storyService.upsertGenre
>;
const mockUpsertCannon = cannonService.upsertCannon as jest.Mock;
const mockFetchUserCannon = cannonService.fetchUserCannon as jest.Mock;
const mockFetchLegacy = cannonService.fetchLegacy as jest.Mock;
const mockDeleteCannon = cannonService.deleteCannon as jest.Mock;

describe(
  'POST /story/cannon',
  testAuth('/story/cannon', 'post', { title: 'My Cannon' }, () => {
    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/story/cannon').set(mockAuthHeaders()).send({});
      expect(res.status).toBe(400);
      expect(res.body.details.properties).toHaveProperty('title');
    });

    it('returns 200 with cannon data on success', async () => {
      mockUpsertCannon.mockResolvedValueOnce(MOCK_CANNON_RESPONSE);

      const res = await request(app)
        .post('/story/cannon')
        .set(mockAuthHeaders())
        .send({ title: 'Test Cannon' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ cannonId: MOCK_CANNON_ID, title: 'Test Cannon' });
      expect(mockUpsertCannon).toHaveBeenCalledWith(MOCK_USER_ID, { title: 'Test Cannon' });
    });

    it('returns 404 when cannon is not found', async () => {
      mockUpsertCannon.mockRejectedValueOnce(new CannonNotFoundError());

      const res = await request(app)
        .post('/story/cannon')
        .set(mockAuthHeaders())
        .send({ cannonId: MOCK_CANNON_ID, title: 'Updated Cannon' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Cannon not found');
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

    it('returns 200 with cannon data on success', async () => {
      mockUpsertStory.mockResolvedValueOnce(MOCK_CANNON_RESPONSE);

      const res = await request(app)
        .post('/story/story')
        .set(mockAuthHeaders())
        .send({ title: 'New Story' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ cannonId: MOCK_CANNON_ID });
      expect(mockUpsertStory).toHaveBeenCalledWith(MOCK_USER_ID, { title: 'New Story' });
    });

    it('returns 404 when cannon is not found', async () => {
      mockUpsertStory.mockRejectedValueOnce(new CannonNotFoundError());

      const res = await request(app)
        .post('/story/story')
        .set(mockAuthHeaders())
        .send({ title: 'My Story', cannonId: MOCK_CANNON_ID });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Cannon not found');
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

    it('returns 200 with cannon data on success', async () => {
      mockUpsertDocument.mockResolvedValueOnce(MOCK_CANNON_RESPONSE);

      const res = await request(app)
        .post('/story/document')
        .set(mockAuthHeaders())
        .send({ title: 'Chapter 1' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ cannonId: MOCK_CANNON_ID });
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
      mockFetchUserDocument.mockResolvedValueOnce(MOCK_DOC_RESPONSE);

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
      mockFetchUserStoryWithDocuments.mockResolvedValueOnce({ ...MOCK_STORY, documents: [] });

      const res = await request(app).get(`/story/story/${MOCK_STORY_ID}`).set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ storyId: MOCK_STORY_ID, cannonId: MOCK_CANNON_ID });
      expect(mockFetchUserStoryWithDocuments).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_STORY_ID);
    });

    it('returns 404 when the story is not found', async () => {
      mockFetchUserStoryWithDocuments.mockRejectedValueOnce(new StoryNotFoundError());

      const res = await request(app).get(`/story/story/${MOCK_STORY_ID}`).set(mockAuthHeaders());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Story not found');
    });
  }),
);

describe(
  'GET /story/cannon/:cannonId',
  mockClear(() => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get(`/story/cannon/${MOCK_CANNON_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 400 when cannonId is not a valid UUID', async () => {
      const res = await request(app).get('/story/cannon/not-a-uuid').set(mockAuthHeaders());
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid path parameters');
    });

    it('returns 200 with the cannon on success', async () => {
      mockFetchUserCannon.mockResolvedValueOnce(MOCK_CANNON_RESPONSE);

      const res = await request(app).get(`/story/cannon/${MOCK_CANNON_ID}`).set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ cannonId: MOCK_CANNON_ID, title: 'Test Cannon' });
      expect(mockFetchUserCannon).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_CANNON_ID);
    });

    it('returns 404 when the cannon is not found', async () => {
      mockFetchUserCannon.mockRejectedValueOnce(new CannonNotFoundError());

      const res = await request(app).get(`/story/cannon/${MOCK_CANNON_ID}`).set(mockAuthHeaders());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Cannon not found');
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

    it('returns 200 with the list of cannons for the user', async () => {
      mockFetchLegacy.mockResolvedValueOnce([MOCK_CANNON_RESPONSE]);

      const res = await request(app).get('/story/legacy').set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ cannonId: MOCK_CANNON_ID });
      expect(mockFetchLegacy).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('returns 200 with an empty array when user has no cannons', async () => {
      mockFetchLegacy.mockResolvedValueOnce([]);

      const res = await request(app).get('/story/legacy').set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  }),
);

describe(
  'DELETE /story/cannon/:cannonId',
  mockClear(() => {
    it('returns 401 without auth', async () => {
      const res = await request(app).delete(`/story/cannon/${MOCK_CANNON_ID}`);
      expect(res.status).toBe(401);
    });

    it('returns 400 when cannonId is not a valid UUID', async () => {
      const res = await request(app).delete('/story/cannon/not-a-uuid').set(mockAuthHeaders());
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid path parameters');
    });

    it('returns 200 on success', async () => {
      mockDeleteCannon.mockResolvedValueOnce(undefined);

      const res = await request(app).delete(`/story/cannon/${MOCK_CANNON_ID}`).set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
      expect(mockDeleteCannon).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_CANNON_ID);
    });

    it('returns 404 when the cannon is not found', async () => {
      mockDeleteCannon.mockRejectedValueOnce(new CannonNotFoundError());

      const res = await request(app).delete(`/story/cannon/${MOCK_CANNON_ID}`).set(mockAuthHeaders());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Cannon not found');
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

      const res = await request(app).delete(`/story/story/${MOCK_STORY_ID}`).set(mockAuthHeaders());

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
      expect(mockDeleteStory).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_STORY_ID);
    });

    it('returns 404 when the story is not found', async () => {
      mockDeleteStory.mockRejectedValueOnce(new StoryNotFoundError());

      const res = await request(app).delete(`/story/story/${MOCK_STORY_ID}`).set(mockAuthHeaders());

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
  testAuth('/story/genre', 'post', { storyId: MOCK_STORY_ID, genres: ['Fantasy'] }, () => {
    it('returns 400 when storyId is missing', async () => {
      const res = await request(app)
        .post('/story/genre')
        .set(mockAuthHeaders())
        .send({ genres: ['Fantasy'] });

      expect(res.status).toBe(400);
      expect(res.body.details.properties).toHaveProperty('storyId');
      expect(mockAddGenres).not.toHaveBeenCalled();
    });

    it('returns 400 when genres is not an array', async () => {
      const res = await request(app)
        .post('/story/genre')
        .set(mockAuthHeaders())
        .send({ storyId: MOCK_STORY_ID, genres: 'Fantasy' });
      expect(res.status).toBe(400);
      expect(res.body.details.properties).toHaveProperty('genres');
      expect(mockAddGenres).not.toHaveBeenCalled();
    });

    it('returns 200 with updated genre list', async () => {
      const headers = mockAuthHeaders();
      mockAddGenres.mockResolvedValueOnce(['Fantasy', 'Sci-Fi']);

      const res = await request(app)
        .post('/story/genre')
        .set(headers)
        .send({ storyId: MOCK_STORY_ID, genres: ['Fantasy', 'Sci-Fi'] });

      expect(res.status).toBe(200);
      expect(res.body.genres).toEqual(['Fantasy', 'Sci-Fi']);
      expect(mockAddGenres).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_STORY_ID, [
        'Fantasy',
        'Sci-Fi',
      ]);
    });

    it('returns 404 when the story is not found', async () => {
      mockAddGenres.mockRejectedValueOnce(new StoryNotFoundError());

      const res = await request(app)
        .post('/story/genre')
        .set(mockAuthHeaders())
        .send({ storyId: MOCK_STORY_ID, genres: ['Fantasy'] });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Story not found');
    });
  }),
);
