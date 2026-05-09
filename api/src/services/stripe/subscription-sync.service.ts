import Stripe from 'stripe';
import { Plan } from '#types/shared/enum/plan';
import type { PlanRow, Queryable } from '#types/database';
import { RenewOn } from '#types/shared/enum/renew-on';
import { StripeSubscriptionStatus, toStripeSubscriptionStatus } from '#types/enum/stripe';
import { StripePaymentFailed } from '#constants/error/custom-errors';
import { env } from '#config/env';
import * as planRepo from '#repositories/plan.repository';

export const syncPlanSnapshot = async (
  client: Queryable,
  args: {
    userId: string;
    planType: Plan;
    subscription: Stripe.Subscription;
    renewOn: RenewOn | null;
    isYearPlan: boolean;
  },
) => {
  const { userId, planType, subscription, renewOn, isYearPlan } = args;

  await planRepo.upsert(client, {
    userId,
    planType,
    isYearPlan,
    renewOn,
    renewDate: getSubscriptionDate(subscription.current_period_end) ?? new Date(),
    priceId: getSubscriptionPriceId(subscription),
    subscriptionId: subscription.id,
    subscriptionStatus: toStripeSubscriptionStatus(subscription.status),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    startDate: getSubscriptionDate(subscription.current_period_start) ?? new Date(),
    endDate: getSubscriptionDate(subscription.canceled_at),
  });
};

export const getStripePriceId = (
  planType: typeof Plan.pro | typeof Plan.max,
  isYearPlan: boolean,
): string => {
  const priceId =
    planType === Plan.pro
      ? isYearPlan
        ? env.STRIPE_PRICE_PRO_YEARLY
        : env.STRIPE_PRICE_PRO_MONTHLY
      : isYearPlan
        ? env.STRIPE_PRICE_MAX_YEARLY
        : env.STRIPE_PRICE_MAX_MONTHLY;

  return (
    priceId ??
    `price_${planType.replace(/[^a-z0-9]/gi, '_')}_${isYearPlan ? RenewOn.yearly : RenewOn.monthly}`
  );
};

export const getSubscriptionPriceId = (subscription: Stripe.Subscription): string | null =>
  subscription.items.data[0]?.price?.id ?? null;

export const getSubscriptionDate = (unixSeconds: number | null): Date | null =>
  unixSeconds ? new Date(unixSeconds * 1000) : null;

export const extractPaymentIntentId = (subscription: Stripe.Subscription): string | null => {
  const latestInvoice = subscription.latest_invoice;

  if (!latestInvoice || typeof latestInvoice === 'string') return null;
  const paymentIntent = latestInvoice.payment_intent;

  if (!paymentIntent) return null;
  return typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id;
};

export const getAmountCentsFromSubscription = (
  subscription: Stripe.Subscription,
  priceId: string,
): number => {
  const price = subscription.items.data.find((item) => item.price?.id === priceId)?.price;
  return price?.unit_amount ?? 0;
};

export const assertBillableSubscription = (subscription: Stripe.Subscription) => {
  const billableStatuses: readonly StripeSubscriptionStatus[] = [
    StripeSubscriptionStatus.active,
    StripeSubscriptionStatus.trialing,
  ];
  if (!billableStatuses.includes(toStripeSubscriptionStatus(subscription.status))) {
    throw new StripePaymentFailed();
  }
};

export const inferPlanTypeFromPriceId = (priceId: string | null, fallback: Plan = Plan.none): Plan => {
  if (!priceId) return fallback;

  const normalized = priceId.toLowerCase();
  if (normalized.includes('pro')) return Plan.pro;
  if (normalized.includes('max')) return Plan.max;

  return fallback;
};

export const inferRenewOnFromSubscription = (subscription: Stripe.Subscription): RenewOn | null => {
  if (
    subscription.cancel_at_period_end ||
    toStripeSubscriptionStatus(subscription.status) === StripeSubscriptionStatus.canceled
  ) {
    return null;
  }

  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  if (interval === 'year') return RenewOn.yearly;
  if (interval === 'month') return RenewOn.monthly;
  return null;
};

export const inferYearPlanFromSubscription = (subscription: Stripe.Subscription): boolean =>
  subscription.items.data[0]?.price?.recurring?.interval === 'year';

const accessibleStatuses: readonly StripeSubscriptionStatus[] = [
  StripeSubscriptionStatus.active,
  StripeSubscriptionStatus.trialing,
  StripeSubscriptionStatus.past_due,
];

export const isAccessibleSubscriptionStatus = (
  status: StripeSubscriptionStatus | null | undefined,
): boolean => !!status && accessibleStatuses.includes(status);

export const getStoredPlanType = (plan: PlanRow | null): Plan =>
  plan?.plan_type ?? Plan.none;

export const getUserPlan = async (queryable: Queryable, userId: string): Promise<Plan | null> => {
  const result = await planRepo.findStatusByUserId(queryable, userId);
  const row = result.rows[0];
  if (!row) return null;
  return isAccessibleSubscriptionStatus(row.subscription_status) ? row.plan_type : null;
};

export const resetPlanToNone = async (client: Queryable, userId: string): Promise<void> => {
  await planRepo.resetToNone(client, userId);
};
