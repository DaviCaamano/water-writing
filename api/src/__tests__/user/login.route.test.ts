import { InvalidCredentialsError, UserNotFoundError } from '#constants/error/custom-errors';

jest.mock('#services/user/login.service');

import request from 'supertest';
import app from '#app';
import * as loginService from '#services/user/login.service';
import {
  MOCK_LOGIN_EMAIL,
  MOCK_LOGIN_RESPONSE,
  MOCK_STRONG_PASSWORD,
} from '#__tests__/constants/mock-user';
import { mockAuthHeaders } from '#__tests__/constants/mock-auth-headers';
import { mockClear } from '#__tests__/utils/test-wrappers';

const mockLogin = loginService.login as jest.Mock;
const mockLogout = loginService.logout as jest.Mock;
const mockGetSession = loginService.getSession as jest.Mock;

describe(
  'POST /user/login',
  mockClear(() => {
    it('returns 400 when body is invalid', async () => {
      const res = await request(app).post('/user/login').send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid email or password');
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('returns 400 when the request body contains malformed JSON', async () => {
      const res = await request(app)
        .post('/user/login')
        .set('Content-Type', 'application/json')
        .send('{"email":"jane@example.com"');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Malformed JSON' });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('returns 401 on invalid credentials', async () => {
      mockLogin.mockRejectedValueOnce(new InvalidCredentialsError());

      const res = await request(app).post('/user/login').send({
        email: MOCK_LOGIN_EMAIL,
        password: MOCK_STRONG_PASSWORD,
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('returns 200 with user data on success and sets httpOnly cookie', async () => {
      mockLogin.mockResolvedValueOnce(MOCK_LOGIN_RESPONSE);

      const res = await request(app).post('/user/login').send({
        email: 'jane@example.com',
        password: MOCK_STRONG_PASSWORD,
      });

      expect(res.status).toBe(200);
      const expectedBody = JSON.parse(JSON.stringify(MOCK_LOGIN_RESPONSE));
      expect(res.body).toMatchObject(expectedBody);
      expect(res.body.token).toBeUndefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('token='))
        : typeof cookies === 'string' && cookies.startsWith('token=')
          ? cookies
          : undefined;
      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toContain('HttpOnly');
      expect(tokenCookie).toContain('SameSite=Strict');
    });
  }),
);

describe(
  'POST /user/logout',
  mockClear(() => {
    it('returns 401 without auth', async () => {
      const res = await request(app).post('/user/logout').send();
      expect(res.status).toBe(401);
    });

    it('returns 200, calls logout with the token, and clears the cookie', async () => {
      mockLogout.mockResolvedValueOnce(undefined);

      const headers = mockAuthHeaders();
      const res = await request(app).post('/user/logout').set(headers).send();
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(mockLogout).toHaveBeenCalledWith(expect.any(String));

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('token='))
        : typeof cookies === 'string' && cookies.startsWith('token=')
          ? cookies
          : undefined;
      expect(tokenCookie).toBeDefined();
    });
  }),
);

describe(
  'GET /user/session',
  mockClear(() => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/user/session').send();
      expect(res.status).toBe(401);
    });

    it('returns 404 when the authenticated user no longer exists', async () => {
      mockGetSession.mockRejectedValueOnce(new UserNotFoundError());

      const res = await request(app).get('/user/session').set(mockAuthHeaders()).send();

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('returns 500 when session refresh fails unexpectedly', async () => {
      mockGetSession.mockRejectedValueOnce(new Error('boom'));

      const res = await request(app).get('/user/session').set(mockAuthHeaders()).send();

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });

    it('returns 200 with the authenticated session payload (without token)', async () => {
      mockGetSession.mockResolvedValueOnce(MOCK_LOGIN_RESPONSE);

      const res = await request(app).get('/user/session').set(mockAuthHeaders()).send();

      expect(res.status).toBe(200);
      const expectedBody = JSON.parse(JSON.stringify(MOCK_LOGIN_RESPONSE));
      expect(res.body).toMatchObject(expectedBody);
      expect(res.body.token).toBeUndefined();
    });
  }),
);
