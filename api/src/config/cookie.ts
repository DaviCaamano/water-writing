import { CookieOptions } from 'express';
import { env } from '#config/env';
import { parseExpiration } from '#utils/database/parse-expiration';
import { authConfig } from '#config/auth';

export const TOKEN_COOKIE_NAME = 'token';

export const tokenCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: parseExpiration(authConfig.jwtExpiresIn),
});
