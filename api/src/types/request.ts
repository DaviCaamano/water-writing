import { Request } from 'express';

// Used by authMiddleware during the authentication process (fields are optional)
export interface AuthRequest extends Request {
  userId?: string | undefined;
  /** The raw Bearer token extracted by authMiddleware */
  token?: string | undefined;
}

/**
 * Narrows an AuthRequest to guaranteed userId and token after authMiddleware.
 * Throws if called before authMiddleware has run (programming error).
 */
export function assertAuthenticated(
  req: AuthRequest,
): asserts req is AuthRequest & { userId: string; token: string } {
  if (!req.userId || !req.token) {
    throw new Error('Route handler called without authMiddleware');
  }
}
