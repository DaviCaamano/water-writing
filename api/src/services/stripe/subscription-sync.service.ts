import Stripe from 'stripe';
import type { PoolClient } from 'pg';
import { Plan } from '#types/shared/enum/plan';
import type { PlanRow } from '#types/database';
import { RenewOn } from '#types/shared/enum/renew-on';
import { StripeSubscriptionStatus } from '#types/enum/stripe';
import { StripePaymentFailed } from '#constants/error/custom-errors';

export async function syncPlanSnapshot(
  client: PoolClient,
  args: {
    userId: string;
    planType: Plan;
    subscription: Stripe.Subscription;
    renewOn: RenewOn | null;
    yearPlan: boolean;
  },
) {
  const { userId, planType, subscription, renewOn, yearPlan } = args;
  const currentPeriodEnd = getSubscriptionDate(subscription.current_period_end) ?? new Date();
  const currentPeriodStart = getSubscriptionDate(subscription.current_period_start) ?? new Date();
  const canceledAt = getSubscriptionDate(subscription.canceled_at);
  const priceId = getSubscriptionPriceId(subscription);

  await client.query(
    `INSERT INTO plans (
       user_id,
       plan_type,
       is_year_plan,
       renew_on,
       renew_date,
       stripe_price_id,
       stripe_subscription_id,
       subscription_status,
       cancel_at_period_end,
       start_date,
       end_date,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET
       plan_type = EXCLUDED.plan_type,
       is_year_plan = EXCLUDED.is_year_plan,
       renew_on = EXCLUDED.renew_on,
       renew_date = EXCLUDED.renew_date,
       stripe_price_id = EXCLUDED.stripe_price_id,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       subscription_status = EXCLUDED.subscription_status,
       cancel_at_period_end = EXCLUDED.cancel_at_period_end,
       start_date = EXCLUDED.start_date,
       end_date = EXCLUDED.end_date,
       updated_at = NOW()`,
    [
      userId,
      planType,
      yearPlan,
      renewOn,
      currentPeriodEnd,
      priceId,
      subscription.id,
      toStripeSubscriptionStatus(subscription.status),
      subscription.cancel_at_period_end,
      currentPeriodStart,
      canceledAt,
    ],
  );
}

export function getStripePriceId(planType: Plan.pro | Plan.max, yearPlan: boolean): string {
  const envKey =
    planType === Plan.pro
      ? yearPlan
        ? 'STRIPE_PRICE_PRO_YEARLY'
        : 'STRIPE_PRICE_PRO_MONTHLY'
      : yearPlan
        ? 'STRIPE_PRICE_MAX_YEARLY'
        : 'STRIPE_PRICE_MAX_MONTHLY';

  return (
    process.env[envKey] ??
    `price_${planType.replace(/[^a-z0-9]/gi, '_')}_${yearPlan ? RenewOn.yearly : RenewOn.monthly}`
  );
}

export function getSubscriptionPriceId(subscription: Stripe.Subscription): string | null {
  return subscription.items.data[0]?.price?.id ?? null;
}

export function getSubscriptionDate(unixSeconds: number | null): Date | null {
  return unixSeconds ? new Date(unixSeconds * 1000) : null;
}

export function extractPaymentIntentId(subscription: Stripe.Subscription): string | null {
  const latestInvoice = subscription.latest_invoice;

  if (!latestInvoice || typeof latestInvoice === 'string') return null;
  const paymentIntent = latestInvoice.payment_intent;

  if (!paymentIntent) return null;
  return typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id;
}

export function getAmountCentsFromSubscription(
  subscription: Stripe.Subscription,
  priceId: string,
): number {
  const price = subscription.items.data.find((item) => item.price?.id === priceId)?.price;
  return price?.unit_amount ?? 0;
}

export function toStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): StripeSubscriptionStatus {
  return status as StripeSubscriptionStatus;
}

export function assertBillableSubscription(subscription: Stripe.Subscription) {
  if (
    ![StripeSubscriptionStatus.active, StripeSubscriptionStatus.trialing].includes(
      toStripeSubscriptionStatus(subscription.status),
    )
  ) {
    throw new StripePaymentFailed();
  }
}

export function inferPlanTypeFromPriceId(priceId: string | null, fallback: Plan = Plan.none): Plan {
  if (!priceId) return fallback;

  const normalized = priceId.toLowerCase();
  if (normalized.includes('pro')) return Plan.pro;
  if (normalized.includes('max')) return Plan.max;

  return fallback;
}

export function inferRenewOnFromSubscription(subscription: Stripe.Subscription): RenewOn | null {
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
}

export function inferYearPlanFromSubscription(subscription: Stripe.Subscription): boolean {
  return subscription.items.data[0]?.price?.recurring?.interval === 'year';
}

export function isAccessibleSubscriptionStatus(
  status: StripeSubscriptionStatus | null | undefined,
): boolean {
  return !!status &&
    [
      StripeSubscriptionStatus.active,
      StripeSubscriptionStatus.trialing,
      StripeSubscriptionStatus.past_due,
    ].includes(status);
}

export function getStoredPlanType(plan: PlanRow | null): Plan {
  return plan?.plan_type ?? Plan.none;
}
