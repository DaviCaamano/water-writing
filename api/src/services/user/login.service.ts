import logger from '#config/logger';
import type { LoginBody } from '#schemas/user.schemas';
import bcrypt from 'bcrypt';
import { UserRow } from '#types/database';
import jwt from 'jsonwebtoken';
import { InvalidCredentialsError, UserNotFoundError } from '#constants/error/custom-errors';
import pool from '#config/database';
import { authConfig } from '#config/auth';
import { LoginResponse } from '#types/shared/response';
import { parseExpiration } from '#utils/database/parse-expiration';
import { fetchLegacy } from '#services/story/cannon.service';
import { getUserPlan } from '#services/stripe/subscription-sync.service';

export const login = async (data: LoginBody): Promise<LoginResponse> => {
  const userResult = await pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [
    data.email,
  ]);

  if (userResult.rows.length === 0) {
    logger.info({ email: data.email }, 'Login failed: unknown email');
    throw new InvalidCredentialsError();
  }

  const user = userResult.rows[0];
  const passwordMatch = await bcrypt.compare(data.password, user.password_hash);
  if (!passwordMatch) {
    logger.info({ userId: user.user_id }, 'Login failed: wrong password');
    throw new InvalidCredentialsError();
  }

  const { jwtSecret, jwtExpiresIn } = authConfig;
  const token = jwt.sign(
    { userId: user.user_id },
    jwtSecret,
    { expiresIn: jwtExpiresIn } as jwt.SignOptions,
  );

  const expiresAt = new Date(Date.now() + parseExpiration(jwtExpiresIn));
  await pool.query(
    'INSERT INTO authentication (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.user_id, token, expiresAt],
  );

  const [plan, legacy] = await Promise.all([
    getUserPlan(pool, user.user_id),
    fetchLegacy(user.user_id),
  ]);

  logger.info({ userId: user.user_id }, 'User logged in');

  return {
    email: user.email,
    userId: user.user_id,
    plan,
    firstName: user.first_name,
    lastName: user.last_name,
    legacy,
    token,
  };
};

export const logout = async (token: string) => {
  const result = await pool.query(
    'DELETE FROM authentication WHERE token = $1 RETURNING user_id',
    [token],
  );
  if (result.rows.length > 0) {
    logger.info({ userId: result.rows[0].user_id }, 'User logged out');
  }
};

export const getSession = async (userId: string, token: string): Promise<LoginResponse> => {
  const userResult = await pool.query<UserRow>('SELECT * FROM users WHERE user_id = $1', [
    userId,
  ]);

  if (userResult.rows.length === 0) {
    logger.info({ userId }, 'Session refresh failed: unknown user');
    throw new UserNotFoundError();
  }

  const user = userResult.rows[0];
  const [plan, legacy] = await Promise.all([
    getUserPlan(pool, user.user_id),
    fetchLegacy(user.user_id),
  ]);

  logger.info({ userId: user.user_id }, 'User session refreshed');

  return {
    email: user.email,
    userId: user.user_id,
    plan,
    firstName: user.first_name,
    lastName: user.last_name,
    legacy,
    token,
  };
};
