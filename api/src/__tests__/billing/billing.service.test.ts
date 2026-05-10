jest.mock('#utils/database/with-transaction');
jest.mock('#config/stripe', () => ({
  __esModule: true,
  default: {
    customers: { create: jest.fn(), update: jest.fn() },
    paymentMethods: { attach: jest.fn() },
    subscriptions: { create: jest.fn(), retrieve: jest.fn(), update: jest.fn() },
  },
}));

import { createMockClient, mockPool } from '#__tests__/constants/mock-database';
import { getBillingHistory, subscribe } from '#services/user/billing.service';
import {
  MOCK_BILLING_RESPONSE,
  MOCK_BILLING_ROW,
  MOCK_SUBSCRIPTION_REQUEST,
  MOCK_USER,
  MOCK_USER_ID,
} from '#__tests__/constants/mock-user';
import { mockClear } from '#__tests__/utils/test-wrappers';
import { PoolClient } from 'pg';
import { withTransaction } from '#utils/database/with-transaction';
import stripe from '#config/stripe';
import { mockStripCustomer, mockStripeSubscription } from '#__tests__/constants/mock-stripe';
import { StripePaymentFailed, UserNotFoundError } from '#constants/error/custom-errors';
import { Plan } from '#types/shared/enum/plan';
import { StripeSubscriptionStatus } from '#types/enum/stripe';

const mockWithTransaction = withTransaction as jest.MockedFunction<typeof withTransaction>;

describe(
  'BillingService',
  mockClear(() => {
    it('should return billing history for a user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [MOCK_BILLING_ROW] });
      const result = await getBillingHistory(MOCK_USER_ID);
      expect(result).toEqual([MOCK_BILLING_RESPONSE]);
    });

    it('should return an empty array when user has no billing records', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      const result = await getBillingHistory(MOCK_USER_ID);
      expect(result).toEqual([]);
    });
  }),
);

describe(
  'subscribe',
  mockClear(() => {
    it('creates a paid subscription for a valid user', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({ rows: [MOCK_USER] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient as PoolClient));
      (stripe.paymentMethods.attach as jest.Mock).mockResolvedValueOnce({});
      (stripe.customers.update as jest.Mock).mockResolvedValueOnce(mockStripCustomer);
      (stripe.subscriptions.create as jest.Mock).mockResolvedValueOnce(mockStripeSubscription);

      await expect(subscribe(MOCK_USER_ID, MOCK_SUBSCRIPTION_REQUEST)).resolves.toMatchObject({
        action: 'subscribed',
        planType: MOCK_SUBSCRIPTION_REQUEST.planType,
        cancelAtPeriodEnd: false,
      });
    });

    it('creates and stores a Stripe customer when the user does not have one yet', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ ...MOCK_USER, stripe_customer_id: null }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient as PoolClient));
      (stripe.customers.create as jest.Mock).mockResolvedValueOnce(mockStripCustomer);
      (stripe.paymentMethods.attach as jest.Mock).mockResolvedValueOnce({});
      (stripe.customers.update as jest.Mock).mockResolvedValueOnce(mockStripCustomer);
      (stripe.subscriptions.create as jest.Mock).mockResolvedValueOnce(mockStripeSubscription);

      await expect(subscribe(MOCK_USER_ID, MOCK_SUBSCRIPTION_REQUEST)).resolves.toBeDefined();
      expect(stripe.customers.create).toHaveBeenCalledTimes(1);
    });

    it('throws UserNotFoundError when the user record is missing', async () => {
      const mockClient = createMockClient();
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient as PoolClient));

      await expect(subscribe(MOCK_USER_ID, MOCK_SUBSCRIPTION_REQUEST)).rejects.toThrow(
        UserNotFoundError,
      );
      expect(stripe.customers.create).not.toHaveBeenCalled();
    });

    it('returns already_canceled without provisioning Stripe when planType is none and no subscription exists', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ ...MOCK_USER, stripe_customer_id: null }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce(undefined);
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient as PoolClient));

      await expect(
        subscribe(MOCK_USER_ID, { planType: Plan.none, isYearPlan: false }),
      ).resolves.toEqual({
        action: 'already_canceled',
        amountCents: null,
        cancelAtPeriodEnd: false,
        planType: null,
        renewDate: null,
        subscriptionStatus: StripeSubscriptionStatus.canceled,
        isYearPlan: false,
      });
      expect(stripe.customers.create).not.toHaveBeenCalled();
    });

    it('throws StripePaymentFailed when Stripe returns a non-billable subscription state', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ ...MOCK_USER, stripe_customer_id: null }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce(undefined);
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient as PoolClient));
      (stripe.customers.create as jest.Mock).mockResolvedValueOnce(mockStripCustomer);
      (stripe.paymentMethods.attach as jest.Mock).mockResolvedValueOnce({});
      (stripe.customers.update as jest.Mock).mockResolvedValueOnce(mockStripCustomer);
      (stripe.subscriptions.create as jest.Mock).mockResolvedValueOnce({
        ...mockStripeSubscription,
        status: 'incomplete',
      });

      await expect(subscribe(MOCK_USER_ID, MOCK_SUBSCRIPTION_REQUEST)).rejects.toThrow(
        StripePaymentFailed,
      );
    });
  }),
);
