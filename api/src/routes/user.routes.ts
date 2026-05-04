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
import { AuthRequest } from '#types/request';
import { getSession, login, logout } from '#services/user/login.service';
import {
  EmailTakenError,
  InvalidCredentialsError,
  StripePaymentFailed,
  UserNotFoundError,
} from '#constants/error/custom-errors';
import {
  LoginResponse,
  LogoutResponse,
  RouteResponse,
  SubscriptionResponse,
  UserResponse,
} from '#types/shared/response';

const router = Router();

// Login
router.post(
  '/login',
  loginLimiter,
  validate(LoginSchema, 'Invalid email or password'),
  async (req: Request, res: RouteResponse<LoginResponse>) => {
    try {
      const result = await login(req.body as LoginBody);
      res.json(result);
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }
      throw err;
    }
  },
);

// Logout (revokes only the current session token)
router.post(
  '/logout',
  authMiddleware,
  async (req: AuthRequest, res: RouteResponse<LogoutResponse>) => {
    await logout(req.token!);
    res.json({ status: 'ok' });
  },
);

router.get(
  '/session',
  authMiddleware,
  async (req: AuthRequest, res: RouteResponse<LoginResponse>): Promise<void> => {
    try {
      res.json(await getSession(req.userId!, req.token!));
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      throw err;
    }
  },
);

// Create account
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
        // Return identical response to prevent email enumeration
        res.status(201).json({ status: 'ok' });
        return;
      }
      throw err;
    }
    res.status(201).json({ status: 'ok' });
  },
);

// Update user
router.post(
  '/',
  authMiddleware,
  generalLimiter,
  validate(UpdateUserSchema),
  async (req: AuthRequest, res: RouteResponse<UserResponse>): Promise<void> => {
    try {
      res.json(await updateUser(req.userId!, req.body as UpdateUserBody));
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      throw err;
    }
  },
);

// Delete account
router.delete(
  '/deleteme',
  authMiddleware,
  async (req: AuthRequest, res: RouteResponse<{ status: 'ok' }>): Promise<void> => {
    try {
      await deleteUser(req.userId!);
      res.json({ status: 'ok' });
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      throw err;
    }
  },
);

// Subscribe
router.post(
  '/subscribe',
  authMiddleware,
  subscribeLimiter,
  validate(SubscribeSchema),
  async (
    req: AuthRequest,
    res: RouteResponse<{ status: string } & SubscriptionResponse>,
  ): Promise<void> => {
    try {
      res.json({ status: 'ok', ...(await subscribe(req.userId!, req.body as SubscribeBody)) });
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      if (err instanceof StripePaymentFailed) {
        res.status(402).json({ error: 'Payment failed' });
        return;
      }
      throw err;
    }
  },
);

export default router;
