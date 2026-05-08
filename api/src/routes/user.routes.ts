import { Router, Request } from 'express';
import { authMiddleware } from '#middleware/auth';
import { validate } from '#middleware/validate';
import {
  loginLimiter,
  createAccountLimiter,
  subscribeLimiter,
  generalLimiter,
} from '#config/rate-limiters';
import {
  LoginSchema,
  LoginBody,
  CreateUserSchema,
  CreateUserBody,
  UpdateUserSchema,
  UpdateUserBody,
  SubscribeSchema,
  SubscribeBody,
} from '#schemas/user.schemas';
import { createUser, updateUser, deleteUser, subscribe } from '#services/user/user.service';
import { AuthRequest, assertAuthenticated } from '#types/request';
import { getSession, login, logout } from '#services/user/login.service';
import { EmailTakenError } from '#constants/error/custom-errors';
import {
  LoginResponse,
  LogoutResponse,
  RouteResponse,
  SubscriptionResponse,
  UserResponse,
} from '#types/shared/response';

const router = Router();

router.post(
  '/login',
  loginLimiter,
  validate(LoginSchema, 'Invalid email or password'),
  async (req: Request, res: RouteResponse<LoginResponse>) => {
    const result = await login(req.body as LoginBody);
    res.json(result);
  },
);

router.post(
  '/logout',
  authMiddleware,
  async (req: AuthRequest, res: RouteResponse<LogoutResponse>) => {
    assertAuthenticated(req);
    await logout(req.token);
    res.json({ status: 'ok' });
  },
);

router.get(
  '/session',
  authMiddleware,
  async (req: AuthRequest, res: RouteResponse<LoginResponse>): Promise<void> => {
    assertAuthenticated(req);
    res.json(await getSession(req.userId, req.token));
  },
);

// Returns the same response whether the email exists or not to prevent enumeration.
router.post(
  '/create',
  createAccountLimiter,
  validate(CreateUserSchema),
  async (req: Request, res: RouteResponse<{ status: 'ok' }>): Promise<void> => {
    const user: CreateUserBody = req.body;
    try {
      await createUser(user);
    } catch (err) {
      if (err instanceof EmailTakenError) {
        res.status(201).json({ status: 'ok' });
        return;
      }
      throw err;
    }
    res.status(201).json({ status: 'ok' });
  },
);

router.post(
  '/',
  authMiddleware,
  generalLimiter,
  validate(UpdateUserSchema),
  async (req: AuthRequest, res: RouteResponse<UserResponse>): Promise<void> => {
    assertAuthenticated(req);
    res.json(await updateUser(req.userId, req.body as UpdateUserBody));
  },
);

router.delete(
  '/deleteme',
  authMiddleware,
  async (req: AuthRequest, res: RouteResponse<{ status: 'ok' }>): Promise<void> => {
    assertAuthenticated(req);
    await deleteUser(req.userId);
    res.json({ status: 'ok' });
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
    res.json({ status: 'ok', ...(await subscribe(req.userId, req.body as SubscribeBody)) });
  },
);

export default router;
