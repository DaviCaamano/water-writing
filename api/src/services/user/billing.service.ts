import pool from '#config/database';
import { BillingResponse, SubscriptionResponse } from '#types/shared/response';
import { PoolClient } from 'pg';
import { PlanRow, UserRow } from '#types/database';
import { mapBilling } from '#utils/database/to-json-camel-case';
import stripe from '#config/stripe';
import { StripePaymentFailed, UserNotFoundError } from '#constants/error/custom-errors';
import { StripeSubscriptionStatus, toStripeSubscriptionStatus } from '#types/enum/stripe';
import * as planRepo from '#repositories/user/plan.repository';
import * as billingRepo from '#repositories/user/billing.repository';
import * as userRepo from '#repositories/user/user.repository';
import * as stripeSyncService from '#services/stripe/subscription-sync.service';
import { Plan } from '#types/shared/enum/plan';
import Stripe from 'stripe';
import { SubscribeBody } from '#schemas/user.schemas';
import { withTransaction } from '#utils/database/with-transaction';
import { RenewOn } from '#types/shared/enum/renew-on';
import logger from '#config/logger';

export const getBillingHistory = async (userId: string): Promise<BillingResponse[]> => {
  const result = await billingRepo.getHistory(pool, userId);
  return result.rows.map(mapBilling);
};

const ensureStripeCustomer = async (client: PoolClient, user: UserRow): Promise<string> => {
  if (user.stripe_customer_id) return user.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.first_name} ${user.last_name}`,
  });
  await userRepo.setStripeCustomerId(client, user.user_id, customer.id);
  return customer.id;
};

const recordBilling = async (
  client: PoolClient,
  userId: string,
  planType: Plan,
  isYearPlan: boolean,
  amountCents: number,
  subscription: Stripe.Subscription,
): Promise<void> => {
  await billingRepo.insert(
    client,
    userId,
    planType,
    isYearPlan,
    amountCents,
    stripeSyncService.extractPaymentIntentId(subscription),
  );
};

export const subscribe = async (
  userId: string,
  data: SubscribeBody,
): Promise<SubscriptionResponse> => {
  return withTransaction(async (client: PoolClient) => {
    const userResult = await userRepo.findById(client, userId);
    const user = userResult.rows[0];
    if (!user) {
      throw new UserNotFoundError();
    }

    const existingPlanResult = await planRepo.findByUserId(client, userId);
    const existingPlan = existingPlanResult.rows[0] ?? null;

    if (data.planType === Plan.none) {
      return cancelSubscription(client, userId, existingPlan);
    }

    const stripeCustomerId = await ensureStripeCustomer(client, user);
    const { planType, isYearPlan, paymentMethodId } = data;
    const renewOn = isYearPlan ? RenewOn.yearly : RenewOn.monthly;
    const priceId = stripeSyncService.getStripePriceId(planType, isYearPlan);

    await stripe.paymentMethods.attach(paymentMethodId, { customer: stripeCustomerId });
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const subscription = await createOrUpdateSubscription({
      existingPlan,
      paymentMethodId,
      priceId,
      stripeCustomerId,
    });

    stripeSyncService.assertBillableSubscription(subscription);

    const amountCents = stripeSyncService.getAmountCentsFromSubscription(subscription, priceId);

    await stripeSyncService.syncPlanSnapshot(client, {
      userId,
      planType,
      subscription,
      renewOn,
      isYearPlan,
    });
    await recordBilling(client, userId, planType, isYearPlan, amountCents, subscription);

    logger.info(
      { userId, planType, isYearPlan, amountCents, subscriptionId: subscription.id },
      existingPlan?.stripe_subscription_id ? 'Subscription updated' : 'Subscription created',
    );

    return {
      action: existingPlan?.stripe_subscription_id ? 'updated' : 'subscribed',
      amountCents,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      planType,
      renewDate: stripeSyncService.getSubscriptionDate(subscription.current_period_end),
      subscriptionStatus: toStripeSubscriptionStatus(subscription.status),
      isYearPlan,
    };
  });
};

const cancelSubscription = async (
  client: PoolClient,
  userId: string,
  existingPlan: PlanRow | null,
): Promise<SubscriptionResponse> => {
  if (!existingPlan?.stripe_subscription_id) {
    await planRepo.resetToNone(client, userId);

    return {
      action: 'already_canceled',
      amountCents: null,
      cancelAtPeriodEnd: false,
      planType: null,
      renewDate: null,
      subscriptionStatus: StripeSubscriptionStatus.canceled,
      isYearPlan: false,
    };
  }

  const subscription = await stripe.subscriptions.update(existingPlan.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  await stripeSyncService.syncPlanSnapshot(client, {
    userId,
    planType: existingPlan.plan_type,
    subscription,
    renewOn: null,
    isYearPlan: existingPlan.is_year_plan,
  });

  logger.info({ userId, subscriptionId: subscription.id }, 'Subscription cancellation scheduled');

  return {
    action: 'cancellation_scheduled',
    amountCents: null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    planType: stripeSyncService.getStoredPlanType(existingPlan),
    renewDate: stripeSyncService.getSubscriptionDate(subscription.current_period_end),
    subscriptionStatus: toStripeSubscriptionStatus(subscription.status),
    isYearPlan: existingPlan.is_year_plan,
  };
};

const createOrUpdateSubscription = async (args: {
  existingPlan: PlanRow | null;
  paymentMethodId: string;
  priceId: string;
  stripeCustomerId: string;
}): Promise<Stripe.Subscription> => {
  const { existingPlan, paymentMethodId, priceId, stripeCustomerId } = args;

  if (existingPlan?.stripe_subscription_id) {
    const existingSubscription = await stripe.subscriptions.retrieve(
      existingPlan.stripe_subscription_id,
    );

    if (
      (
        [
          StripeSubscriptionStatus.canceled,
          StripeSubscriptionStatus.incompleteExpired,
        ] as readonly StripeSubscriptionStatus[]
      ).includes(toStripeSubscriptionStatus(existingSubscription.status))
    ) {
      return stripe.subscriptions.create({
        customer: stripeCustomerId,
        default_payment_method: paymentMethodId,
        items: [{ price: priceId }],
        payment_behavior: 'error_if_incomplete',
      });
    }

    const currentItem = existingSubscription.items.data[0];
    if (!currentItem) {
      throw new StripePaymentFailed();
    }

    return stripe.subscriptions.update(existingSubscription.id, {
      cancel_at_period_end: false,
      default_payment_method: paymentMethodId,
      items: [{ id: currentItem.id, price: priceId }],
      proration_behavior: 'create_prorations',
    });
  }

  return stripe.subscriptions.create({
    customer: stripeCustomerId,
    default_payment_method: paymentMethodId,
    items: [{ price: priceId }],
    payment_behavior: 'error_if_incomplete',
  });
};
