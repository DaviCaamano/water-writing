jest.mock('#config/stripe', () => ({ __esModule: true, default: {} }));
jest.mock('#config/env', () => ({
  env: {
    STRIPE_PRICE_PRO_MONTHLY: 'price_pro_monthly',
    STRIPE_PRICE_PRO_YEARLY: 'price_pro_yearly',
    STRIPE_PRICE_MAX_MONTHLY: 'price_max_monthly',
    STRIPE_PRICE_MAX_YEARLY: 'price_max_yearly',
  },
}));

import Stripe from 'stripe';
import { Plan } from '#types/shared/enum/plan';
import { RenewOn } from '#types/shared/enum/renew-on';
import { StripeSubscriptionStatus } from '#types/enum/stripe';
import { StripePaymentFailed } from '#constants/error/custom-errors';
import {
  mockStripeSubscription,
  mockStripePriceId,
  mockStripePaymentIntent,
} from '#__tests__/constants/mock-stripe';
import { MOCK_DATE } from '#__tests__/constants/mock-basic';
import { mockClear } from '#__tests__/utils/test-wrappers';

import {
  inferPlanTypeFromPriceId,
  inferRenewOnFromSubscription,
  inferYearPlanFromSubscription,
  assertBillableSubscription,
  isAccessibleSubscriptionStatus,
  getStripePriceId,
  getSubscriptionDate,
  extractPaymentIntentId,
  getAmountCentsFromSubscription,
  getStoredPlanType,
  getSubscriptionPriceId,
} from '#services/stripe/subscription-sync.service';

describe(
  'inferPlanTypeFromPriceId',
  mockClear(() => {
    it('returns Plan.pro when price id contains "pro"', () => {
      expect(inferPlanTypeFromPriceId('price_pro_monthly')).toBe(Plan.pro);
    });

    it('returns Plan.max when price id contains "max"', () => {
      expect(inferPlanTypeFromPriceId('price_max_yearly')).toBe(Plan.max);
    });

    it('returns the fallback when price id matches neither', () => {
      expect(inferPlanTypeFromPriceId('price_unknown')).toBe(Plan.none);
    });

    it('returns the fallback when price id is null', () => {
      expect(inferPlanTypeFromPriceId(null)).toBe(Plan.none);
    });

    it('uses a custom fallback when provided', () => {
      expect(inferPlanTypeFromPriceId(null, Plan.pro)).toBe(Plan.pro);
    });
  }),
);

describe(
  'inferRenewOnFromSubscription',
  mockClear(() => {
    it('returns RenewOn.monthly for a monthly interval', () => {
      expect(inferRenewOnFromSubscription(mockStripeSubscription)).toBe(RenewOn.monthly);
    });

    it('returns RenewOn.yearly for a yearly interval', () => {
      const yearly = {
        ...mockStripeSubscription,
        items: {
          ...mockStripeSubscription.items,
          data: [
            {
              ...mockStripeSubscription.items.data[0],
              price: {
                ...mockStripeSubscription.items.data[0]!.price,
                recurring: {
                  ...mockStripeSubscription.items.data[0]!.price.recurring,
                  interval: 'year',
                },
              },
            },
          ],
        },
      } as unknown as Stripe.Subscription;
      expect(inferRenewOnFromSubscription(yearly)).toBe(RenewOn.yearly);
    });

    it('returns null when subscription is canceled', () => {
      const canceled = {
        ...mockStripeSubscription,
        status: 'canceled',
      } as unknown as Stripe.Subscription;
      expect(inferRenewOnFromSubscription(canceled)).toBeNull();
    });

    it('returns null when cancel_at_period_end is true', () => {
      const canceling = {
        ...mockStripeSubscription,
        cancel_at_period_end: true,
      } as unknown as Stripe.Subscription;
      expect(inferRenewOnFromSubscription(canceling)).toBeNull();
    });
  }),
);

describe(
  'inferYearPlanFromSubscription',
  mockClear(() => {
    it('returns false for a monthly subscription', () => {
      expect(inferYearPlanFromSubscription(mockStripeSubscription)).toBe(false);
    });

    it('returns true for a yearly subscription', () => {
      const yearly = {
        ...mockStripeSubscription,
        items: {
          ...mockStripeSubscription.items,
          data: [
            {
              ...mockStripeSubscription.items.data[0],
              price: {
                ...mockStripeSubscription.items.data[0]!.price,
                recurring: {
                  ...mockStripeSubscription.items.data[0]!.price.recurring,
                  interval: 'year',
                },
              },
            },
          ],
        },
      } as unknown as Stripe.Subscription;
      expect(inferYearPlanFromSubscription(yearly)).toBe(true);
    });
  }),
);

describe(
  'assertBillableSubscription',
  mockClear(() => {
    it('does not throw for an active subscription', () => {
      expect(() => assertBillableSubscription(mockStripeSubscription)).not.toThrow();
    });

    it('does not throw for a trialing subscription', () => {
      const trialing = {
        ...mockStripeSubscription,
        status: 'trialing',
      } as unknown as Stripe.Subscription;
      expect(() => assertBillableSubscription(trialing)).not.toThrow();
    });

    it('throws StripePaymentFailed for an incomplete subscription', () => {
      const incomplete = {
        ...mockStripeSubscription,
        status: 'incomplete',
      } as unknown as Stripe.Subscription;
      expect(() => assertBillableSubscription(incomplete)).toThrow(StripePaymentFailed);
    });

    it('throws StripePaymentFailed for a canceled subscription', () => {
      const canceled = {
        ...mockStripeSubscription,
        status: 'canceled',
      } as unknown as Stripe.Subscription;
      expect(() => assertBillableSubscription(canceled)).toThrow(StripePaymentFailed);
    });
  }),
);

describe(
  'isAccessibleSubscriptionStatus',
  mockClear(() => {
    it('returns true for active status', () => {
      expect(isAccessibleSubscriptionStatus(StripeSubscriptionStatus.active)).toBe(true);
    });

    it('returns true for trialing status', () => {
      expect(isAccessibleSubscriptionStatus(StripeSubscriptionStatus.trialing)).toBe(true);
    });

    it('returns true for past_due status', () => {
      expect(isAccessibleSubscriptionStatus(StripeSubscriptionStatus.past_due)).toBe(true);
    });

    it('returns false for canceled status', () => {
      expect(isAccessibleSubscriptionStatus(StripeSubscriptionStatus.canceled)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isAccessibleSubscriptionStatus(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isAccessibleSubscriptionStatus(undefined)).toBe(false);
    });
  }),
);

describe(
  'getStripePriceId',
  mockClear(() => {
    it('returns the pro monthly price id', () => {
      expect(getStripePriceId(Plan.pro, false)).toBe('price_pro_monthly');
    });

    it('returns the pro yearly price id', () => {
      expect(getStripePriceId(Plan.pro, true)).toBe('price_pro_yearly');
    });

    it('returns the max monthly price id', () => {
      expect(getStripePriceId(Plan.max, false)).toBe('price_max_monthly');
    });

    it('returns the max yearly price id', () => {
      expect(getStripePriceId(Plan.max, true)).toBe('price_max_yearly');
    });
  }),
);

describe(
  'getSubscriptionDate',
  mockClear(() => {
    it('converts unix seconds to a Date', () => {
      const unixSeconds = Math.floor(MOCK_DATE.getTime() / 1000);
      expect(getSubscriptionDate(unixSeconds)).toEqual(MOCK_DATE);
    });

    it('returns null for null input', () => {
      expect(getSubscriptionDate(null)).toBeNull();
    });

    it('returns null for zero', () => {
      expect(getSubscriptionDate(0)).toBeNull();
    });
  }),
);

describe(
  'extractPaymentIntentId',
  mockClear(() => {
    it('returns the payment intent id from an expanded subscription', () => {
      expect(extractPaymentIntentId(mockStripeSubscription)).toBe(mockStripePaymentIntent.id);
    });

    it('returns string payment intent id directly', () => {
      const sub = {
        ...mockStripeSubscription,
        latest_invoice: {
          ...(mockStripeSubscription.latest_invoice as object),
          payment_intent: 'pi_direct',
        },
      } as unknown as Stripe.Subscription;
      expect(extractPaymentIntentId(sub)).toBe('pi_direct');
    });

    it('returns null when latest_invoice is null', () => {
      const sub = {
        ...mockStripeSubscription,
        latest_invoice: null,
      } as unknown as Stripe.Subscription;
      expect(extractPaymentIntentId(sub)).toBeNull();
    });

    it('returns null when latest_invoice is a string id', () => {
      const sub = {
        ...mockStripeSubscription,
        latest_invoice: 'in_123',
      } as unknown as Stripe.Subscription;
      expect(extractPaymentIntentId(sub)).toBeNull();
    });

    it('returns null when payment_intent is null', () => {
      const sub = {
        ...mockStripeSubscription,
        latest_invoice: {
          ...(mockStripeSubscription.latest_invoice as object),
          payment_intent: null,
        },
      } as unknown as Stripe.Subscription;
      expect(extractPaymentIntentId(sub)).toBeNull();
    });
  }),
);

describe(
  'getAmountCentsFromSubscription',
  mockClear(() => {
    it('returns the unit_amount for the matching price id', () => {
      expect(getAmountCentsFromSubscription(mockStripeSubscription, mockStripePriceId)).toBe(1000);
    });

    it('returns 0 when the price id does not match any item', () => {
      expect(getAmountCentsFromSubscription(mockStripeSubscription, 'price_nonexistent')).toBe(0);
    });
  }),
);

describe(
  'getStoredPlanType',
  mockClear(() => {
    it('returns the plan type from a plan row', () => {
      expect(getStoredPlanType({ plan_type: Plan.pro } as any)).toBe(Plan.pro);
    });

    it('returns Plan.none when plan is null', () => {
      expect(getStoredPlanType(null)).toBe(Plan.none);
    });
  }),
);

describe(
  'getSubscriptionPriceId',
  mockClear(() => {
    it('returns the price id from the first subscription item', () => {
      expect(getSubscriptionPriceId(mockStripeSubscription)).toBe(mockStripePriceId);
    });

    it('returns null when items data is empty', () => {
      const sub = {
        ...mockStripeSubscription,
        items: { ...mockStripeSubscription.items, data: [] },
      } as unknown as Stripe.Subscription;
      expect(getSubscriptionPriceId(sub)).toBeNull();
    });
  }),
);
