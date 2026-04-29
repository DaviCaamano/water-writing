jest.mock('#utils/database/with-transaction');
jest.mock('#utils/database/with-query');
jest.mock('#config/stripe', () => ({
  __esModule: true,
  default: {
    customers: { create: jest.fn(), update: jest.fn() },
    paymentMethods: { attach: jest.fn() },
    subscriptions: { create: jest.fn(), retrieve: jest.fn(), update: jest.fn() },
  },
}));

import { createUser, subscribe, updateUser } from '#services/user/user.service';
import {
  MOCK_NEW_USER,
  MOCK_PLAN,
  MOCK_SUBSCRIPTION_REQUEST,
  MOCK_UPDATING_USER,
  MOCK_USER,
  MOCK_USER_ID,
} from '#__tests__/constants/mock-user';
import { createMockClient, mockPool } from '#__tests__/constants/mock-database';
import { EmailTakenError, StripePaymentFailed } from '#constants/error/custom-errors';
import { PoolClient } from 'pg';
import { withTransaction } from '#utils/database/with-transaction';
import stripe from '#config/stripe';
import { mockStripCustomer, mockStripeSubscription } from '#__tests__/constants/mock-stripe';
import { mockClear } from '#__tests__/utils/test-wrappers';

const mockWithTransaction = withTransaction as jest.MockedFunction<typeof withTransaction>;

describe(
  'user service: createUser',
  mockClear(() => {
    it('should create a new user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce(undefined);
      await expect(createUser(MOCK_NEW_USER)).resolves.not.toThrow();
    });

    it('throw EmailTakenError error if email is taken', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [MOCK_USER] });
      await expect(createUser(MOCK_NEW_USER)).rejects.toThrow(EmailTakenError);
    });
  }),
);

describe(
  'user service: updateUser',
  mockClear(() => {
    it('should update a user', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [MOCK_USER] })
        .mockResolvedValueOnce({ rows: [MOCK_PLAN] });

      mockWithTransaction.mockImplementation((callback) => callback(mockClient as PoolClient));

      await expect(updateUser(MOCK_USER_ID, MOCK_UPDATING_USER)).resolves.not.toThrow();
    });
  }),
);

describe(
  'user service: subscribe',
  mockClear(() => {
    it('should subscribe user to pro-plan', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({ rows: [MOCK_USER] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce(undefined) // insertPlanQuery
        .mockResolvedValueOnce(undefined); // insertBillingQuery
      mockWithTransaction.mockImplementation((callback) => callback(mockClient as PoolClient));
      (stripe.paymentMethods.attach as jest.Mock).mockResolvedValueOnce({});
      (stripe.customers.update as jest.Mock).mockResolvedValueOnce(mockStripCustomer);
      (stripe.subscriptions.create as jest.Mock).mockResolvedValueOnce(mockStripeSubscription);
      await expect(subscribe(MOCK_USER_ID, MOCK_SUBSCRIPTION_REQUEST)).resolves.not.toThrow();
    });

    it('should update users stripe customer id', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ ...MOCK_USER, stripe_customer_id: null }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined) // insertPlanQuery
        .mockResolvedValueOnce(undefined); // insertBillingQuery
      mockWithTransaction.mockImplementation((callback) => callback(mockClient as PoolClient));
      (stripe.customers.create as jest.Mock).mockResolvedValueOnce(mockStripCustomer);
      (stripe.paymentMethods.attach as jest.Mock).mockResolvedValueOnce({});
      (stripe.customers.update as jest.Mock).mockResolvedValueOnce(mockStripCustomer);
      (stripe.subscriptions.create as jest.Mock).mockResolvedValueOnce(mockStripeSubscription);
      await expect(subscribe(MOCK_USER_ID, MOCK_SUBSCRIPTION_REQUEST)).resolves.not.toThrow();
    });

    it('throw StripePaymentFailed error if stripe subscription is not active', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ ...MOCK_USER, stripe_customer_id: null }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce(undefined);
      mockWithTransaction.mockImplementation((callback) => callback(mockClient as PoolClient));
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
