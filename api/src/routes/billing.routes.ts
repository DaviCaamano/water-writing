import { getBillingHistory } from '#services/user/billing.service';
import { authMiddleware } from '#middleware/auth';
import { Router } from 'express';
import { generalLimiter, subscribeLimiter } from '#config/rate-limiters';
import { validate, validateParams } from '#middleware/validate';
import {
  BillingHistoryParams,
  BillingHistoryParamsSchema,
  SubscribeBody,
  SubscribeSchema,
} from '#schemas/user.schemas';
import { AuthRequest, assertAuthenticated } from '#types/request';
import { BillingResponse, RouteResponse, SubscriptionResponse } from '#types/shared/response';
import * as billingService from '#services/user/billing.service';

const router = Router();

// Billing history (owner-only)
router.get(
  '/history/:userId',
  authMiddleware,
  generalLimiter,
  validateParams(BillingHistoryParamsSchema),
  async (req: AuthRequest, res: RouteResponse<BillingResponse[]>): Promise<void> => {
    assertAuthenticated(req);
    const params = req.params as BillingHistoryParams;

    // Ensure the authenticated user can only access their own billing history
    if (req.userId !== params.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const result = await getBillingHistory(params.userId);
    res.json(result);
  },
);

router.post(
  '/subscribe',
  authMiddleware,
  subscribeLimiter,
  validate(SubscribeSchema),
  async (
    req: AuthRequest,
    res: RouteResponse<{ status: string } & SubscriptionResponse>,
  ): Promise<void> => {
    assertAuthenticated(req);
    res.json({
      status: 'ok',
      ...(await billingService.subscribe(req.userId, req.body as SubscribeBody)),
    });
  },
);

export default router;
