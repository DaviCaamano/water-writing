jest.mock('#services/user/user.service');
jest.mock('#services/user/billing.service');
jest.mock('#config/stripe', () => ({ __esModule: true, default: {} }));

import { StripePaymentFailed, UserNotFoundError } from '#constants/error/custom-errors';
import * as billingService from '#services/user/billing.service';
import {
  MOCK_BILLING_RESPONSE,
  MOCK_SUBSCRIPTION_REQUEST,
  MOCK_USER_ID,
} from '#__tests__/constants/mock-user';
import request from 'supertest';
import app from '#app';
import { mockClear, testAuth } from '#__tests__/utils/test-wrappers';
import { mockAuthHeaders } from '#__tests__/constants/mock-auth-headers';

const mockGetBillingHistory = billingService.getBillingHistory as jest.Mock;
const mockSubscribe = billingService.subscribe as jest.MockedFunction<typeof billingService.subscribe>;

describe(
  'GET /history/:userId',
  mockClear(() => {
    it('returns 200 with billing history for own account', async () => {
      const headers = mockAuthHeaders(MOCK_USER_ID);
      mockGetBillingHistory.mockResolvedValueOnce([MOCK_BILLING_RESPONSE]);

      const res = await request(app).get(`/billing/history/${MOCK_USER_ID}`).set(headers);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { ...MOCK_BILLING_RESPONSE, billedAt: MOCK_BILLING_RESPONSE.billedAt.toISOString() },
      ]);
      expect(mockGetBillingHistory).toHaveBeenCalledWith(MOCK_USER_ID);
    });

    it('returns 403 when requesting another users billing history', async () => {
      const headers = mockAuthHeaders(MOCK_USER_ID);
      const otherUserId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

      const res = await request(app).get(`/billing/history/${otherUserId}`).set(headers);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });
  }),
);

describe(
  'POST /billing/subscribe',
  testAuth('/billing/subscribe', 'post', MOCK_SUBSCRIPTION_REQUEST, () => {
    it('returns 400 when the paid-plan request is missing a payment method id', async () => {
      const res = await request(app)
        .post('/billing/subscribe')
        .set(mockAuthHeaders())
        .send({ planType: 'pro-plan', isYearPlan: false });

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
        isYearPlan: false,
      });

      const res = await request(app)
        .post('/billing/subscribe')
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
        isYearPlan: false,
      });
      expect(mockSubscribe).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_SUBSCRIPTION_REQUEST);
    });

    it('returns 402 on a payment processing error', async () => {
      mockSubscribe.mockImplementationOnce(() => {
        throw new StripePaymentFailed();
      });
      const res = await request(app)
        .post('/billing/subscribe')
        .set(mockAuthHeaders())
        .send(MOCK_SUBSCRIPTION_REQUEST);
      expect(res.status).toBe(402);
      expect(res.body.error).toBe('Payment failed');
      expect(mockSubscribe).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_SUBSCRIPTION_REQUEST);
    });

    it('returns 404 when the authenticated user no longer exists', async () => {
      mockSubscribe.mockRejectedValueOnce(new UserNotFoundError());

      const res = await request(app)
        .post('/billing/subscribe')
        .set(mockAuthHeaders())
        .send(MOCK_SUBSCRIPTION_REQUEST);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });
  }),
);
