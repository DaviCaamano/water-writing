import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '#config/database';
import { authConfig } from '#config/auth';
import logger from '#config/logger';
import { TOKEN_COOKIE_NAME } from '#config/cookie';
import { AuthRequest } from '#types/request';
import * as authRepo from '#repositories/auth.repository';

function extractToken(req: AuthRequest): string | null {
  const cookieToken = req.cookies?.[TOKEN_COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.split(' ')[1] ?? null;

  return null;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = extractToken(req);
  if (!token) {
    logger.warn({ ip: req.ip, path: req.path }, 'Auth failure: no token provided');
    res.status(401).json({ error: 'No auth token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret) as unknown as { userId: string };

    const result = await authRepo.validateToken(pool, token, decoded.userId);

    if (result.rows.length === 0) {
      logger.warn({ userId: decoded.userId, path: req.path }, 'Auth failure: token expired or revoked');
      res.status(401).json({ error: 'Token expired or revoked' });
      return;
    }

    req.userId = decoded.userId;
    req.token = token;
    next();
  } catch {
    logger.warn({ ip: req.ip, path: req.path }, 'Auth failure: invalid token');
    res.status(401).json({ error: 'Invalid token' });
  }
};
