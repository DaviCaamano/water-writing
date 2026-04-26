import { Router } from 'express';
import { authMiddleware } from '#middleware/auth';
import { validate, validateParams } from '#middleware/validate';
import { aiLimiter, generalLimiter } from '#config/rate-limiters';
import {
  UpsertDocumentSchema,
  UpsertDocumentBody,
  UpsertStorySchema,
  UpsertStoryBody,
  UpsertWorldSchema,
  UpsertWorldBody,
  EditorSchema,
  EditorBody,
  DocumentParams,
  DocumentParamsSchema,
  StoryParamsSchema,
  StoryParams,
  WorldParamsSchema,
  WorldParams,
} from '#schemas/story.schemas';
import {
  deleteStory,
  fetchStoryWithDocuments,
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
  WorldNotFoundError,
} from '#constants/error/custom-errors';
import {
  deleteWorld,
  fetchLegacy,
  fetchWorld,
  upsertWorld,
} from '#services/story/world.service';
import { waterWrite } from '#services/story/editor.service';
import {
  DocumentResponse,
  RouteResponse,
  StoryResponse,
  WorldResponse,
} from '#types/shared/response';
import { GenresBody, GenresSchema } from '#schemas/story.schemas';
import { Response } from 'express';
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
      const story = await fetchStoryWithDocuments(storyId!);
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
  '/world/:worldId',
  authMiddleware,
  generalLimiter,
  validateParams(WorldParamsSchema),
  async (req: AuthRequest, res: RouteResponse<WorldResponse>): Promise<void> => {
    const { worldId } = req.params as WorldParams;
    try {
      const world = await fetchWorld(worldId!);
      res.json(world);
    } catch (err) {
      if (err instanceof WorldNotFoundError) {
        res.status(404).json({ error: 'Story not found' });
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
  async (req: AuthRequest, res: RouteResponse<WorldResponse[]>): Promise<void> => {
      const world = await fetchLegacy(req.userId!);
      res.json(world);
  },
);

router.post(
  '/document',
  authMiddleware,
  generalLimiter,
  validate(UpsertDocumentSchema),
  async (req: AuthRequest, res: RouteResponse<WorldResponse | null>): Promise<void> => {
    try {
      const world = await upsertDocument(req.userId!, req.body as UpsertDocumentBody);
      res.json(world);
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
      const world = await upsertStory(req.userId!, req.body as UpsertStoryBody);
      res.json(world);
    } catch (err) {
      if (err instanceof WorldNotFoundError) {
        res.status(404).json({ error: 'World not found' });
        return;
      }
      throw err;
    }
  },
);

router.post(
  '/world',
  authMiddleware,
  generalLimiter,
  validate(UpsertWorldSchema),
  async (req: AuthRequest, res: RouteResponse<WorldResponse | null>): Promise<void> => {
    try {
      const world = await upsertWorld(req.userId!, req.body as UpsertWorldBody);
      res.json(world);
    } catch (err) {
      if (err instanceof WorldNotFoundError) {
        res.status(404).json({ error: 'World not found' });
      } else {
        throw err;
      }
    }
  },
);

router.delete(
  '/world/:worldId',
  authMiddleware,
  generalLimiter,
  validateParams(WorldParamsSchema),
  async (req: AuthRequest, res: RouteResponse<{ status: 'ok' }>): Promise<void> => {
    const { worldId } = req.params as WorldParams;
    try {
      await deleteWorld(req.userId!, worldId);
      res.json({ status: 'ok' });
    } catch (err) {
      if (err instanceof WorldNotFoundError) {
        res.status(404).json({ error: 'World not found' });
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
  async (req: AuthRequest, res: Response<{ genres: string[] }>): Promise<void> => {
    const { genres } = req.body as GenresBody;
    res.json({ genres: await upsertGenre(req.userId!, genres) });
  },
);

export default router;
