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
import { AuthRequest } from '#types/request';
import {
  deleteDocument,
  fetchUserDocument,
  upsertDocument,
} from '#services/story/document.service';
import {
  DocumentNotFoundError,
  InvalidSelectionError,
  StoryNotFoundError,
  CannonNotFoundError,
} from '#constants/error/custom-errors';
import {
  deleteCannon,
  fetchLegacy,
  fetchUserCannon,
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
import { mapStoryResponse } from '#utils/story/map-story';

const router = Router();

router.get(
  '/document/:documentId',
  authMiddleware,
  generalLimiter,
  validateParams(DocumentParamsSchema),
  async (req: AuthRequest, res: RouteResponse<DocumentResponse>): Promise<void> => {
    const { documentId } = req.params as DocumentParams;
    try {
      const document = await fetchUserDocument(req.userId!, documentId);
      res.json(document);
    } catch (err) {
      if (err instanceof DocumentNotFoundError) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      throw err;
    }
  },
);

router.get(
  '/story/:storyId',
  authMiddleware,
  generalLimiter,
  validateParams(StoryParamsSchema),
  async (req: AuthRequest, res: RouteResponse<StoryResponse>): Promise<void> => {
    const { storyId } = req.params as StoryParams;
    try {
      const story = await fetchUserStoryWithDocuments(req.userId!, storyId);
      res.json(mapStoryResponse(story));
    } catch (err) {
      if (err instanceof StoryNotFoundError) {
        res.status(404).json({ error: 'Story not found' });
        return;
      }
      throw err;
    }
  },
);

router.get(
  '/stories',
  authMiddleware,
  generalLimiter,
  async (req: AuthRequest, res: RouteResponse<StoryResponse[]>): Promise<void> => {
    const stories = await fetchUserStories(req.userId!);
    res.json(stories);
  },
);

router.get(
  '/cannon/:cannonId',
  authMiddleware,
  generalLimiter,
  validateParams(CannonParamsSchema),
  async (req: AuthRequest, res: RouteResponse<CannonResponse>): Promise<void> => {
    const { cannonId } = req.params as CannonParams;
    try {
      const cannon = await fetchUserCannon(req.userId!, cannonId);
      res.json(cannon);
    } catch (err) {
      if (err instanceof CannonNotFoundError) {
        res.status(404).json({ error: 'Cannon not found' });
        return;
      }
      throw err;
    }
  },
);

router.get(
  '/legacy',
  authMiddleware,
  generalLimiter,
  async (req: AuthRequest, res: RouteResponse<CannonResponse[]>): Promise<void> => {
    const cannon = await fetchLegacy(req.userId!);
    res.json(cannon);
  },
);

router.post(
  '/document',
  authMiddleware,
  generalLimiter,
  validate(UpsertDocumentSchema),
  async (req: AuthRequest, res: RouteResponse<CannonResponse | null>): Promise<void> => {
    try {
      const cannon = await upsertDocument(req.userId!, req.body as UpsertDocumentBody);
      res.json(cannon);
    } catch (err) {
      if (err instanceof StoryNotFoundError) {
        res.status(404).json({ error: 'Story not found' });
        return;
      }
      throw err;
    }
  },
);

router.post(
  '/story',
  authMiddleware,
  generalLimiter,
  validate(UpsertStorySchema),
  async (req: AuthRequest, res: RouteResponse<StoryResponse>): Promise<void> => {
    try {
      const cannon = await upsertStory(req.userId!, req.body as UpsertStoryBody);
      res.json(cannon);
    } catch (err) {
      if (err instanceof CannonNotFoundError) {
        res.status(404).json({ error: 'Cannon not found' });
        return;
      }
      throw err;
    }
  },
);

router.post(
  '/cannon',
  authMiddleware,
  generalLimiter,
  validate(UpsertCannonSchema),
  async (req: AuthRequest, res: RouteResponse<CannonResponse | null>): Promise<void> => {
    try {
      const cannon = await upsertCannon(req.userId!, req.body as UpsertCannonBody);
      res.json(cannon);
    } catch (err) {
      if (err instanceof CannonNotFoundError) {
        res.status(404).json({ error: 'Cannon not found' });
      } else {
        throw err;
      }
    }
  },
);

router.delete(
  '/cannon/:cannonId',
  authMiddleware,
  generalLimiter,
  validateParams(CannonParamsSchema),
  async (req: AuthRequest, res: RouteResponse<{ status: 'ok' }>): Promise<void> => {
    const { cannonId } = req.params as CannonParams;
    try {
      await deleteCannon(req.userId!, cannonId);
      res.json({ status: 'ok' });
    } catch (err) {
      if (err instanceof CannonNotFoundError) {
        res.status(404).json({ error: 'Cannon not found' });
        return;
      }
      throw err;
    }
  },
);

router.delete(
  '/story/:storyId',
  authMiddleware,
  generalLimiter,
  validateParams(StoryParamsSchema),
  async (req: AuthRequest, res: RouteResponse<{ status: 'ok' }>): Promise<void> => {
    const { storyId } = req.params as StoryParams;
    try {
      await deleteStory(req.userId!, storyId);
      res.json({ status: 'ok' });
    } catch (err) {
      if (err instanceof StoryNotFoundError) {
        res.status(404).json({ error: 'Story not found' });
        return;
      }
      throw err;
    }
  },
);

router.delete(
  '/document/:documentId',
  authMiddleware,
  generalLimiter,
  validateParams(DocumentParamsSchema),
  async (req: AuthRequest, res: RouteResponse<{ status: 'ok' }>): Promise<void> => {
    const { documentId } = req.params as DocumentParams;
    try {
      await deleteDocument(req.userId!, documentId);
      res.json({ status: 'ok' });
    } catch (err) {
      if (err instanceof DocumentNotFoundError) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      throw err;
    }
  },
);

router.post(
  '/water-write',
  authMiddleware,
  aiLimiter,
  validate(EditorSchema),
  async (req: AuthRequest, res: RouteResponse<never>): Promise<void> => {
    try {
      const body = req.body as EditorBody;
      await waterWrite(req.userId!, body.documentId, body.selection, body.prompt, res);
    } catch (err) {
      if (err instanceof DocumentNotFoundError) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      if (err instanceof InvalidSelectionError) {
        res.status(400).json({ error: 'Invalid selection range' });
        return;
      }
      throw err;
    }
  },
);

// Add genres
router.post(
  '/genre',
  authMiddleware,
  generalLimiter,
  validate(GenresSchema),
  async (req: AuthRequest, res: RouteResponse<{ genres: string[] }>): Promise<void> => {
    try {
      const { story_id, genres } = req.body as GenresBody;
      res.json({ genres: await upsertGenre(req.userId!, story_id, genres) });
    } catch (err) {
      if (err instanceof StoryNotFoundError) {
        res.status(404).json({ error: 'Story not found' });
        return;
      }
      throw err;
    }
  },
);

export default router;
