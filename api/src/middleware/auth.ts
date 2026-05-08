import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '#config/database';
import { authConfig } from '#config/auth';
import { AuthRequest } from '#types/request';
import * as authRepo from '#repositories/auth.repository';

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No auth token provided' });
    return;
  }

  const token = authHeader.split(' ')[1] ?? '';

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret) as unknown as { userId: string };

    const result = await authRepo.validateToken(pool, token, decoded.userId);

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Token expired or revoked' });
      return;
    }

    req.userId = decoded.userId;
    req.token = token;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
