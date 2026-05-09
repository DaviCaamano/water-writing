import { Router } from 'express';
import { authMiddleware } from '#middleware/auth';
import { validate, validateParams } from '#middleware/validate';
import { aiLimiter, generalLimiter } from '#config/rate-limiters';
import {
  UpsertDocumentSchema,
  UpsertDocumentBody,
  UpsertStorySchema,
  UpsertStoryBody,
  UpsertCannonSchema,
  UpsertCannonBody,
  EditorSchema,
  EditorBody,
  DocumentParams,
  DocumentParamsSchema,
  StoryParamsSchema,
  StoryParams,
  CannonParamsSchema,
  CannonParams,
} from '#schemas/story.schemas';
import {
  deleteStory,
  fetchUserStoryWithDocuments,
  fetchUserStories,
  upsertGenre,
  upsertStory,
} from '#services/story/story.service';
import { AuthRequest, assertAuthenticated } from '#types/request';
import {
  deleteDocument,
  fetchUserDocument,
  upsertDocument,
} from '#services/story/document.service';
import {
  deleteCannon,
  fetchCannon,
  fetchLegacy,
  upsertCannon,
} from '#services/story/cannon.service';
import { waterWrite } from '#services/story/editor.service';
import {
  DocumentResponse,
  RouteResponse,
  StoryResponse,
  CannonResponse,
} from '#types/shared/response';
import { GenresBody, GenresSchema } from '#schemas/story.schemas';
import { mapStoryResponse } from '#utils/database/to-json-camel-case';

const router = Router();

router.get(
  '/document/:documentId',
  authMiddleware,
  generalLimiter,
  validateParams(DocumentParamsSchema),
  async (req: AuthRequest, res: RouteResponse<DocumentResponse>): Promise<void> => {
    assertAuthenticated(req);
    const { documentId } = req.params as DocumentParams;
    const document = await fetchUserDocument(req.userId, documentId);
    res.json(document);
  },
);

router.get(
  '/story/:storyId',
  authMiddleware,
  generalLimiter,
  validateParams(StoryParamsSchema),
  async (req: AuthRequest, res: RouteResponse<StoryResponse>): Promise<void> => {
    assertAuthenticated(req);
    const { storyId } = req.params as StoryParams;
    const story = await fetchUserStoryWithDocuments(req.userId, storyId);
    res.json(mapStoryResponse(story));
  },
);

router.get(
  '/stories',
  authMiddleware,
  generalLimiter,
  async (req: AuthRequest, res: RouteResponse<StoryResponse[]>): Promise<void> => {
    assertAuthenticated(req);
    const stories = await fetchUserStories(req.userId);
    res.json(stories);
  },
);

router.get(
  '/cannon/:cannonId',
  authMiddleware,
  generalLimiter,
  validateParams(CannonParamsSchema),
  async (req: AuthRequest, res: RouteResponse<CannonResponse>): Promise<void> => {
    assertAuthenticated(req);
    const { cannonId } = req.params as CannonParams;
    const cannon = await fetchCannon(cannonId, req.userId);
    res.json(cannon);
  },
);

router.get(
  '/legacy',
  authMiddleware,
  generalLimiter,
  async (req: AuthRequest, res: RouteResponse<CannonResponse[]>): Promise<void> => {
    assertAuthenticated(req);
    const cannon = await fetchLegacy(req.userId);
    res.json(cannon);
  },
);

router.post(
  '/document',
  authMiddleware,
  generalLimiter,
  validate(UpsertDocumentSchema),
  async (req: AuthRequest, res: RouteResponse<CannonResponse | null>): Promise<void> => {
    assertAuthenticated(req);
    const cannon = await upsertDocument(req.userId, req.body as UpsertDocumentBody);
    res.json(cannon);
  },
);

router.post(
  '/story',
  authMiddleware,
  generalLimiter,
  validate(UpsertStorySchema),
  async (req: AuthRequest, res: RouteResponse<StoryResponse>): Promise<void> => {
    assertAuthenticated(req);
    const story = await upsertStory(req.userId, req.body as UpsertStoryBody);
    res.json(story);
  },
);

router.post(
  '/cannon',
  authMiddleware,
  generalLimiter,
  validate(UpsertCannonSchema),
  async (req: AuthRequest, res: RouteResponse<CannonResponse | null>): Promise<void> => {
    assertAuthenticated(req);
    const cannon = await upsertCannon(req.userId, req.body as UpsertCannonBody);
    res.json(cannon);
  },
);

router.delete(
  '/cannon/:cannonId',
  authMiddleware,
  generalLimiter,
  validateParams(CannonParamsSchema),
  async (req: AuthRequest, res: RouteResponse<{ status: 'ok' }>): Promise<void> => {
    assertAuthenticated(req);
    const { cannonId } = req.params as CannonParams;
    await deleteCannon(req.userId, cannonId);
    res.json({ status: 'ok' });
  },
);

router.delete(
  '/story/:storyId',
  authMiddleware,
  generalLimiter,
  validateParams(StoryParamsSchema),
  async (req: AuthRequest, res: RouteResponse<{ status: 'ok' }>): Promise<void> => {
    assertAuthenticated(req);
    const { storyId } = req.params as StoryParams;
    await deleteStory(req.userId, storyId);
    res.json({ status: 'ok' });
  },
);

router.delete(
  '/document/:documentId',
  authMiddleware,
  generalLimiter,
  validateParams(DocumentParamsSchema),
  async (req: AuthRequest, res: RouteResponse<{ status: 'ok' }>): Promise<void> => {
    assertAuthenticated(req);
    const { documentId } = req.params as DocumentParams;
    await deleteDocument(req.userId, documentId);
    res.json({ status: 'ok' });
  },
);

router.post(
  '/water-write',
  authMiddleware,
  aiLimiter,
  validate(EditorSchema),
  async (req: AuthRequest, res: RouteResponse<never>): Promise<void> => {
    assertAuthenticated(req);
    const body = req.body as EditorBody;
    const stream = await waterWrite(req.userId, body.documentId, body.selection, body.prompt);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const text of stream) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
    } catch {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
    }
    res.end();
  },
);

router.post(
  '/genre',
  authMiddleware,
  generalLimiter,
  validate(GenresSchema),
  async (req: AuthRequest, res: RouteResponse<{ genres: string[] }>): Promise<void> => {
    assertAuthenticated(req);
    const { storyId, genres } = req.body as GenresBody;
    res.json({ genres: await upsertGenre(req.userId, storyId, genres) });
  },
);

export default router;
