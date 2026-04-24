jest.mock('#utils/database/with-transaction');
jest.mock('#config/stripe', () => ({
  __esModule: true,
  default: {
    subscriptions: { retrieve: jest.fn() },
  },
}));

import Stripe from 'stripe';
import { PoolClient } from 'pg';
import { handleStripeWebhook } from '#services/stripe/stripe-webhook.service';
import { withTransaction } from '#utils/database/with-transaction';
import stripe from '#config/stripe';
import { createMockClient, mockPool } from '#__tests__/constants/mock-database';
import { mockClear } from '#__tests__/utils/test-wrappers';
import { MOCK_PLAN, MOCK_USER, MOCK_USER_ID } from '#__tests__/constants/mock-user';
import {
  MOCK_STRIPE_PAYMENT_INTENT_ID,
  mockStripeCustomerId,
  mockStripeInvoice,
  mockStripeSubscription,
  mockStripeSubscriptionId,
} from '#__tests__/constants/mock-stripe';

const mockWithTransaction = withTransaction as jest.MockedFunction<typeof withTransaction>;
const mockRetrieveSubscription = stripe.subscriptions.retrieve as jest.Mock;

function buildEvent<T extends Stripe.Event.Type>(type: T, object: unknown): Stripe.Event {
  return {
    id: 'evt_test',
    object: 'event',
    api_version: '2024-01-01',
    created: 0,
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    type,
    data: { object: object as Stripe.Event.Data.Object },
  } as unknown as Stripe.Event;
}

describe(
  'stripe-webhook service: handleStripeWebhook',
  mockClear(() => {
    it('ignores unsupported event types without touching the database', async () => {
      await expect(
        handleStripeWebhook(buildEvent('payment_intent.created', { id: 'pi_1' })),
      ).resolves.toBeUndefined();

      expect(mockPool.query).not.toHaveBeenCalled();
      expect(mockWithTransaction).not.toHaveBeenCalled();
    });

    describe('customer.subscription.* events', () => {
      it('syncs the plan snapshot for the matched user', async () => {
        const mockClient = createMockClient();
        mockClient.query.mockResolvedValueOnce({ rows: [MOCK_PLAN] }).mockResolvedValueOnce(undefined);
        mockPool.query.mockResolvedValueOnce({ rows: [MOCK_USER] });
        mockWithTransaction.mockImplementation((callback) => callback(mockClient as PoolClient));

        await expect(
          handleStripeWebhook(buildEvent('customer.subscription.updated', mockStripeSubscription)),
        ).resolves.toBeUndefined();

        expect(mockPool.query).toHaveBeenCalledWith(
          'SELECT * FROM users WHERE stripe_customer_id = $1 LIMIT 1',
          [mockStripeCustomerId],
        );
        expect(mockWithTransaction).toHaveBeenCalledTimes(1);
        expect(mockClient.query).toHaveBeenCalledTimes(2);
        const insertCall = mockClient.query.mock.calls[1];
        expect(insertCall[0]).toEqual(expect.stringContaining('INSERT INTO plans'));
        expect(insertCall[1][0]).toBe(MOCK_USER_ID);
      });

      it('returns early when no user matches the stripe customer', async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });

        await expect(
          handleStripeWebhook(buildEvent('customer.subscription.created', mockStripeSubscription)),
        ).resolves.toBeUndefined();

        expect(mockWithTransaction).not.toHaveBeenCalled();
      });

      it('returns early when the subscription has no customer id', async () => {
        await expect(
          handleStripeWebhook(
            buildEvent('customer.subscription.deleted', {
              ...mockStripeSubscription,
              customer: null,
            }),
          ),
        ).resolves.toBeUndefined();

        expect(mockPool.query).not.toHaveBeenCalled();
        expect(mockWithTransaction).not.toHaveBeenCalled();
      });
    });

    describe('invoice.paid events', () => {
      const paidInvoice = {
        ...mockStripeInvoice,
        lines: {
          ...mockStripeInvoice.lines,
          data: [{ price: { id: 'price_pro_monthly' } }],
        },
        payment_intent: MOCK_STRIPE_PAYMENT_INTENT_ID,
      } as unknown as Stripe.Invoice;

      it('returns early when customer or subscription id is missing', async () => {
        await expect(
          handleStripeWebhook(
            buildEvent('invoice.paid', { ...paidInvoice, customer: null, subscription: null }),
          ),
        ).resolves.toBeUndefined();

        expect(mockPool.query).not.toHaveBeenCalled();
        expect(mockRetrieveSubscription).not.toHaveBeenCalled();
      });

      it('returns early when no user matches the stripe customer', async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });

        await expect(
          handleStripeWebhook(buildEvent('invoice.paid', paidInvoice)),
        ).resolves.toBeUndefined();

        expect(mockRetrieveSubscription).not.toHaveBeenCalled();
        expect(mockWithTransaction).not.toHaveBeenCalled();
      });

      it('syncs the plan snapshot and inserts a billing record', async () => {
        const mockClient = createMockClient();
        mockClient.query
          .mockResolvedValueOnce({ rows: [MOCK_PLAN] })
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce(undefined);
        mockPool.query.mockResolvedValueOnce({ rows: [MOCK_USER] });
        mockRetrieveSubscription.mockResolvedValueOnce(mockStripeSubscription);
        mockWithTransaction.mockImplementation((callback) => callback(mockClient as PoolClient));

        await expect(
          handleStripeWebhook(buildEvent('invoice.paid', paidInvoice)),
        ).resolves.toBeUndefined();

        expect(mockRetrieveSubscription).toHaveBeenCalledWith(mockStripeSubscriptionId, {
          expand: ['latest_invoice.payment_intent'],
        });
        expect(mockClient.query).toHaveBeenCalledTimes(4);
        const insertBilling = mockClient.query.mock.calls[3];
        expect(insertBilling[0]).toEqual(expect.stringContaining('INSERT INTO billing'));
        expect(insertBilling[1][0]).toBe(MOCK_USER_ID);
        expect(insertBilling[1][3]).toBe(paidInvoice.amount_paid);
        expect(insertBilling[1][5]).toBe(paidInvoice.id);
      });

      it('skips billing insert if the invoice is already recorded', async () => {
        const mockClient = createMockClient();
        mockClient.query
          .mockResolvedValueOnce({ rows: [MOCK_PLAN] })
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce({ rows: [{ billing_id: 'existing' }] });
        mockPool.query.mockResolvedValueOnce({ rows: [MOCK_USER] });
        mockRetrieveSubscription.mockResolvedValueOnce(mockStripeSubscription);
        mockWithTransaction.mockImplementation((callback) => callback(mockClient as PoolClient));

        await expect(
          handleStripeWebhook(buildEvent('invoice.paid', paidInvoice)),
        ).resolves.toBeUndefined();

        expect(mockClient.query).toHaveBeenCalledTimes(3);
      });
    });

    describe('invoice.payment_failed events', () => {
      const failedInvoice = {
        ...mockStripeInvoice,
        status: 'open',
        payment_intent: MOCK_STRIPE_PAYMENT_INTENT_ID,
      } as unknown as Stripe.Invoice;

      it('returns early when customer or subscription id is missing', async () => {
        await expect(
          handleStripeWebhook(
            buildEvent('invoice.payment_failed', {
              ...failedInvoice,
              customer: null,
              subscription: null,
            }),
          ),
        ).resolves.toBeUndefined();

        expect(mockRetrieveSubscription).not.toHaveBeenCalled();
      });

      it('returns early when no user matches the stripe customer', async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });

        await expect(
          handleStripeWebhook(buildEvent('invoice.payment_failed', failedInvoice)),
        ).resolves.toBeUndefined();

        expect(mockRetrieveSubscription).not.toHaveBeenCalled();
        expect(mockWithTransaction).not.toHaveBeenCalled();
      });

      it('syncs the plan snapshot without writing billing', async () => {
        const mockClient = createMockClient();
        mockClient.query.mockResolvedValueOnce({ rows: [MOCK_PLAN] }).mockResolvedValueOnce(undefined);
        mockPool.query.mockResolvedValueOnce({ rows: [MOCK_USER] });
        mockRetrieveSubscription.mockResolvedValueOnce(mockStripeSubscription);
        mockWithTransaction.mockImplementation((callback) => callback(mockClient as PoolClient));

        await expect(
          handleStripeWebhook(buildEvent('invoice.payment_failed', failedInvoice)),
        ).resolves.toBeUndefined();

        expect(mockRetrieveSubscription).toHaveBeenCalledWith(mockStripeSubscriptionId, {
          expand: ['latest_invoice.payment_intent'],
        });
        expect(mockClient.query).toHaveBeenCalledTimes(2);
        expect(mockClient.query.mock.calls[1][0]).toEqual(expect.stringContaining('INSERT INTO plans'));
      });
    });
  }),
);
