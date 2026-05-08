jest.mock('#utils/database/with-transaction');
jest.mock('#config/stripe', () => ({
  __esModule: true,
  default: {
    customers: { create: jest.fn(), update: jest.fn() },
    paymentMethods: { attach: jest.fn() },
    subscriptions: { create: jest.fn(), retrieve: jest.fn(), update: jest.fn() },
  },
}));

import { createUser, deleteUser, subscribe, updateUser } from '#services/user/user.service';
import {
  MOCK_NEW_USER,
  MOCK_PLAN,
  MOCK_SUBSCRIPTION_REQUEST,
  MOCK_UPDATING_USER,
  MOCK_USER,
  MOCK_USER_ID,
} from '#__tests__/constants/mock-user';
import { createMockClient, mockPool } from '#__tests__/constants/mock-database';
import {
  EmailTakenError,
  StripePaymentFailed,
  UserNotFoundError,
} from '#constants/error/custom-errors';
import { PoolClient } from 'pg';
import { withTransaction } from '#utils/database/with-transaction';
import stripe from '#config/stripe';
import { mockStripCustomer, mockStripeSubscription } from '#__tests__/constants/mock-stripe';
import { mockClear } from '#__tests__/utils/test-wrappers';
import { Plan } from '#types/shared/enum/plan';
import { StripeSubscriptionStatus } from '#types/enum/stripe';

const mockWithTransaction = withTransaction as jest.MockedFunction<typeof withTransaction>;

describe(
  'createUser',
  mockClear(() => {
    it('creates a new user when the email is available', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce(undefined);

      await expect(createUser(MOCK_NEW_USER)).resolves.toBeUndefined();
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('throws EmailTakenError when the email already exists', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [MOCK_USER] });

      await expect(createUser(MOCK_NEW_USER)).rejects.toThrow(EmailTakenError);
    });

    it('maps a database unique violation to EmailTakenError', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce({ code: '23505' });

      await expect(createUser(MOCK_NEW_USER)).rejects.toThrow(EmailTakenError);
    });
  }),
);

describe(
  'updateUser',
  mockClear(() => {
    it('updates a user and returns the mapped response', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [MOCK_USER] })
        .mockResolvedValueOnce({ rows: [MOCK_PLAN] });
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient as PoolClient));

      await expect(updateUser(MOCK_USER_ID, MOCK_UPDATING_USER)).resolves.toEqual({
        userId: MOCK_USER.user_id,
        firstName: MOCK_USER.first_name,
        lastName: MOCK_USER.last_name,
        email: MOCK_USER.email,
        plan: MOCK_PLAN.plan_type,
      });
    });

    it('throws UserNotFoundError when the user disappears before the response is built', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient as PoolClient));

      await expect(updateUser(MOCK_USER_ID, { firstName: 'Jane' })).rejects.toThrow(
        UserNotFoundError,
      );
    });
  }),
);

describe(
  'deleteUser',
  mockClear(() => {
    it('deletes the user when the account exists', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: MOCK_USER_ID }] });

      await expect(deleteUser(MOCK_USER_ID)).resolves.toBeUndefined();
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [MOCK_USER_ID]);
    });

    it('throws UserNotFoundError when no account exists for the user id', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(deleteUser(MOCK_USER_ID)).rejects.toThrow(UserNotFoundError);
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
        subscribe(MOCK_USER_ID, { planType: Plan.none, yearPlan: false }),
      ).resolves.toEqual({
        action: 'already_canceled',
        amountCents: null,
        cancelAtPeriodEnd: false,
        planType: null,
        renewDate: null,
        subscriptionStatus: StripeSubscriptionStatus.canceled,
        yearPlan: false,
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
