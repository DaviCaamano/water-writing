import { Router, Request } from 'express';
import { authMiddleware } from '#middleware/auth';
import { validate } from '#middleware/validate';
import { TOKEN_COOKIE_NAME, tokenCookieOptions } from '#config/cookie';
import { loginLimiter, createAccountLimiter, generalLimiter } from '#config/rate-limiters';
import {
  LoginSchema,
  LoginBody,
  CreateUserSchema,
  CreateUserBody,
  UpdateUserSchema,
  UpdateUserBody,
} from '#schemas/user.schemas';
import { AuthRequest, assertAuthenticated } from '#types/request';
import * as userService from '#services/user/user.service';
import * as loginService from '#services/user/login.service';
import { EmailTakenError } from '#constants/error/custom-errors';
import { LoginResponse, LogoutResponse, RouteResponse, UserResponse } from '#types/shared/response';

const router = Router();

router.post(
  '/login',
  loginLimiter,
  validate(LoginSchema, 'Invalid email or password'),
  async (req: Request, res: RouteResponse<Omit<LoginResponse, 'token'>>) => {
    const { token, ...body } = await loginService.login(req.body as LoginBody);
    res.cookie(TOKEN_COOKIE_NAME, token, tokenCookieOptions());
    res.json(body);
  },
);

router.post(
  '/logout',
  authMiddleware,
  async (req: AuthRequest, res: RouteResponse<LogoutResponse>) => {
    assertAuthenticated(req);
    await loginService.logout(req.token);
    res.clearCookie(TOKEN_COOKIE_NAME, tokenCookieOptions());
    res.json({ status: 'ok' });
  },
);

router.get(
  '/session',
  authMiddleware,
  async (req: AuthRequest, res: RouteResponse<Omit<LoginResponse, 'token'>>): Promise<void> => {
    assertAuthenticated(req);
    const result = await loginService.getSession(req.userId, req.token);
    const { token, ...body } = result;
    void token;
    res.json(body);
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
      await userService.createUser(user);
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
    res.json(await userService.updateUser(req.userId, req.body as UpdateUserBody));
  },
);

router.delete(
  '/deleteme',
  authMiddleware,
  async (req: AuthRequest, res: RouteResponse<{ status: 'ok' }>): Promise<void> => {
    assertAuthenticated(req);
    await userService.deleteUser(req.userId);
    res.json({ status: 'ok' });
  },
);

export default router;
