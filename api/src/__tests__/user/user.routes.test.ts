import {
  EmailTakenError,
  StripePaymentFailed,
  UserNotFoundError,
} from '#constants/error/custom-errors';

jest.mock('#services/user/user.service');
jest.mock('#config/stripe', () => ({ __esModule: true, default: {} }));

import request from 'supertest';
import app from '#app';
import * as userService from '#services/user/user.service';
import { mockAuthHeaders } from '#__tests__/constants/mock-auth-headers';
import { MOCK_STRONG_PASSWORD, MOCK_SUBSCRIPTION_REQUEST } from '#__tests__/constants/mock-user';
import { mockClear, testAuth } from '#__tests__/utils/test-wrappers';

app.set('trust proxy', true);

const mockCreateUser = userService.createUser as jest.MockedFunction<typeof userService.createUser>;
const mockUpdateUser = userService.updateUser as jest.MockedFunction<typeof userService.updateUser>;
const mockDeleteUser = userService.deleteUser as jest.MockedFunction<typeof userService.deleteUser>;
const mockSubscribe = userService.subscribe as jest.MockedFunction<typeof userService.subscribe>;

const MOCK_LOGIN_RESPONSE = {
  email: 'jane@example.com',
  userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  plan: null,
  firstName: 'Jane',
  lastName: 'Doe',
  legacy: [],
  token: 'mock-jwt-token',
};

// POST /user/create
describe(
  'POST /user/create',
  mockClear(() => {
    it('returns 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/user/create')
        .set('X-Forwarded-For', '10.0.0.1')
        .send({ email: 'bad' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid request body');
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/user/create')
        .set('X-Forwarded-For', '10.0.0.2')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'not-an-email',
          password: MOCK_STRONG_PASSWORD,
        });
      expect(res.status).toBe(400);
      expect(res.body.details.properties).toHaveProperty('email');
    });

    it('returns 400 when password is too weak', async () => {
      const res = await request(app)
        .post('/user/create')
        .set('X-Forwarded-For', '10.0.0.3')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'short',
        });
      expect(res.status).toBe(400);
      expect(res.body.details.properties).toHaveProperty('password');
    });

    it('returns 400 when password is strong-looking but below the 12 character minimum', async () => {
      const res = await request(app)
        .post('/user/create')
        .set('X-Forwarded-For', '10.0.0.4')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'Aa1!aaaaaaa',
        });

      expect(res.status).toBe(400);
      expect(res.body.details.properties).toHaveProperty('password');
    });

    it('returns 201 even when email is already registered (anti-enumeration)', async () => {
      mockCreateUser.mockRejectedValueOnce(new EmailTakenError());

      const res = await request(app)
        .post('/user/create')
        .set('X-Forwarded-For', '10.0.0.5')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: MOCK_STRONG_PASSWORD,
        });
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ status: 'ok' });
      expect(res.body.password).toBeUndefined();
    });

    it('returns 201 on successful creation', async () => {
      mockCreateUser.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/user/create')
        .set('X-Forwarded-For', '10.0.0.6')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: MOCK_STRONG_PASSWORD,
        });
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ status: 'ok' });
      expect(res.body.password).toBeUndefined();
      expect(mockCreateUser).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: MOCK_STRONG_PASSWORD,
      });
    });
  }),
);

// POST /user
describe(
  'POST /user',
  testAuth('/user', 'post', { firstName: 'Janet' }, () => {
    it('returns 400 when no updatable fields are provided', async () => {
      const res = await request(app).post('/user').set(mockAuthHeaders()).send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid request body');
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('returns 200 with the updated user payload on success', async () => {
      mockUpdateUser.mockResolvedValueOnce({
        userId: MOCK_LOGIN_RESPONSE.userId,
        firstName: 'Janet',
        lastName: MOCK_LOGIN_RESPONSE.lastName,
        email: MOCK_LOGIN_RESPONSE.email,
        plan: null,
      });

      const res = await request(app)
        .post('/user')
        .set(mockAuthHeaders())
        .send({ firstName: 'Janet' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        userId: MOCK_LOGIN_RESPONSE.userId,
        firstName: 'Janet',
        lastName: MOCK_LOGIN_RESPONSE.lastName,
        email: MOCK_LOGIN_RESPONSE.email,
        plan: null,
      });
      expect(mockUpdateUser).toHaveBeenCalledWith(MOCK_LOGIN_RESPONSE.userId, {
        firstName: 'Janet',
      });
    });

    it('returns 404 when the authenticated user no longer exists', async () => {
      mockUpdateUser.mockRejectedValueOnce(new UserNotFoundError());

      const res = await request(app)
        .post('/user')
        .set(mockAuthHeaders())
        .send({ firstName: 'Janet' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });
  }),
);

// DELETE /user/deleteme
describe(
  'DELETE /user/deleteme',
  testAuth('/user/deleteme', 'delete', () => {
    it('returns 200 and deletes the user', async () => {
      mockDeleteUser.mockResolvedValueOnce(undefined);
      const res = await request(app).delete('/user/deleteme').set(mockAuthHeaders()).send();
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(mockDeleteUser).toHaveBeenCalledWith(MOCK_LOGIN_RESPONSE.userId);
    });

    it('returns 404 when the authenticated user no longer exists', async () => {
      mockDeleteUser.mockRejectedValueOnce(new UserNotFoundError());

      const res = await request(app).delete('/user/deleteme').set(mockAuthHeaders()).send();

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });
  }),
);

// POST /user/subscribe
describe(
  'POST /user/subscribe',
  testAuth('/user/subscribe', 'post', MOCK_SUBSCRIPTION_REQUEST, () => {
    it('returns 400 when the paid-plan request is missing a payment method id', async () => {
      const res = await request(app)
        .post('/user/subscribe')
        .set(mockAuthHeaders())
        .send({ planType: 'pro-plan', yearPlan: false });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid request body');
      expect(mockSubscribe).not.toHaveBeenCalled();
    });

    it('returns 200 and creates subscription', async () => {
      mockSubscribe.mockResolvedValueOnce({
        action: 'subscribed',
        amountCents: 1234,
        cancelAtPeriodEnd: false,
        planType: MOCK_SUBSCRIPTION_REQUEST.planType,
        renewDate: null,
        subscriptionStatus: null,
        yearPlan: false,
      });

      const res = await request(app)
        .post('/user/subscribe')
        .set(mockAuthHeaders())
        .send(MOCK_SUBSCRIPTION_REQUEST);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'ok',
        action: 'subscribed',
        amountCents: 1234,
        cancelAtPeriodEnd: false,
        planType: MOCK_SUBSCRIPTION_REQUEST.planType,
        renewDate: null,
        subscriptionStatus: null,
        yearPlan: false,
      });
      expect(mockSubscribe).toHaveBeenCalledWith(
        MOCK_LOGIN_RESPONSE.userId,
        MOCK_SUBSCRIPTION_REQUEST,
      );
    });

    it('returns 402 on a payment processing error', async () => {
      mockSubscribe.mockImplementationOnce(() => {
        throw new StripePaymentFailed();
      });
      const res = await request(app)
        .post('/user/subscribe')
        .set(mockAuthHeaders())
        .send(MOCK_SUBSCRIPTION_REQUEST);
      expect(res.status).toBe(402);
      expect(res.body.error).toBe('Payment failed');
      expect(mockSubscribe).toHaveBeenCalledWith(
        MOCK_LOGIN_RESPONSE.userId,
        MOCK_SUBSCRIPTION_REQUEST,
      );
    });

    it('returns 404 when the authenticated user no longer exists', async () => {
      mockSubscribe.mockRejectedValueOnce(new UserNotFoundError());

      const res = await request(app)
        .post('/user/subscribe')
        .set(mockAuthHeaders())
        .send(MOCK_SUBSCRIPTION_REQUEST);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });
  }),
);
