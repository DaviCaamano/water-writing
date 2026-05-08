import bcrypt from 'bcrypt';
import Stripe from 'stripe';
import pool from '#config/database';
import stripe from '#config/stripe';
import logger from '#config/logger';
import type { CreateUserBody, UpdateUserBody, SubscribeBody } from '#schemas/user.schemas';
import { PlanRow, UserRow } from '#types/database';
import {
  EmailTakenError,
  StripePaymentFailed,
  UserNotFoundError,
} from '#constants/error/custom-errors';
import { SubscriptionResponse, UserResponse } from '#types/shared/response';
import { Plan } from '#types/shared/enum/plan';
import {
  assertBillableSubscription,
  extractPaymentIntentId,
  getAmountCentsFromSubscription,
  getStoredPlanType,
  getStripePriceId,
  getSubscriptionDate,
  getUserPlan,
  syncPlanSnapshot,
} from '#services/stripe/subscription-sync.service';
import { withTransaction } from '#utils/database/with-transaction';
import { PoolClient } from 'pg';
import { RenewOn } from '#types/shared/enum/renew-on';
import { StripeSubscriptionStatus, toStripeSubscriptionStatus } from '#types/enum/stripe';
import { assertFound } from '#utils/database/assert-found';
import * as userRepo from '#repositories/user.repository';
import * as planRepo from '#repositories/plan.repository';
import * as billingRepo from '#repositories/billing.repository';

const SALT_ROUNDS = 12;

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

export async function createUser(data: CreateUserBody): Promise<void> {
  const existing = await userRepo.emailExists(pool, data.email);
  if (existing.rows.length > 0) throw new EmailTakenError();

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  try {
    await userRepo.insert(pool, data.firstName, data.lastName, data.email, passwordHash);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new EmailTakenError();
    }
    throw error;
  }
  logger.info({ email: data.email }, 'User account created');
}

export const updateUser = async (userId: string, data: UpdateUserBody): Promise<UserResponse> => {
  return withTransaction(async (client: PoolClient) => {
    const updates: string[] = [];
    const values: (string | Date)[] = [];
    let paramIdx = 1;

    if (data.firstName) {
      updates.push(`first_name = $${paramIdx++}`);
      values.push(data.firstName);
    }
    if (data.lastName) {
      updates.push(`last_name = $${paramIdx++}`);
      values.push(data.lastName);
    }
    if (data.password) {
      const hash = await bcrypt.hash(data.password, SALT_ROUNDS);
      updates.push(`password_hash = $${paramIdx++}`);
      values.push(hash);
      logger.info({ userId }, 'Password changed');
    }

    if (updates.length > 0) {
      updates.push(`updated_at = $${paramIdx++}`);
      values.push(new Date());
      values.push(userId);
      await userRepo.update(client, updates, values);
    }

    const [userResult, plan] = await Promise.all([
      userRepo.findById(client, userId),
      getUserPlan(client, userId),
    ]);
    const user = userResult.rows[0];
    if (!user) {
      throw new UserNotFoundError();
    }
    logger.info({ userId, fields: Object.keys(data) }, 'User updated');

    return {
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      plan,
    };
  });
};

export async function deleteUser(userId: string): Promise<void> {
  assertFound(await userRepo.deleteById(pool, userId), UserNotFoundError);
  logger.info({ userId }, 'User account deleted');
}

async function ensureStripeCustomer(
  client: PoolClient,
  user: UserRow,
): Promise<string> {
  if (user.stripe_customer_id) return user.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.first_name} ${user.last_name}`,
  });
  await userRepo.setStripeCustomerId(client, user.user_id, customer.id);
  return customer.id;
}

async function recordBilling(
  client: PoolClient,
  userId: string,
  planType: Plan,
  isYearPlan: boolean,
  amountCents: number,
  subscription: Stripe.Subscription,
): Promise<void> {
  await billingRepo.insert(client, userId, planType, isYearPlan, amountCents, extractPaymentIntentId(subscription));
}

export async function subscribe(
  userId: string,
  data: SubscribeBody,
): Promise<SubscriptionResponse> {
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
    const priceId = getStripePriceId(planType, isYearPlan);

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

    assertBillableSubscription(subscription);

    const amountCents = getAmountCentsFromSubscription(subscription, priceId);

    await syncPlanSnapshot(client, { userId, planType, subscription, renewOn, isYearPlan });
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
      renewDate: getSubscriptionDate(subscription.current_period_end),
      subscriptionStatus: toStripeSubscriptionStatus(subscription.status),
      isYearPlan,
    };
  });
}

async function cancelSubscription(
  client: PoolClient,
  userId: string,
  existingPlan: PlanRow | null,
): Promise<SubscriptionResponse> {
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

  await syncPlanSnapshot(client, {
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
    planType: getStoredPlanType(existingPlan),
    renewDate: getSubscriptionDate(subscription.current_period_end),
    subscriptionStatus: toStripeSubscriptionStatus(subscription.status),
    isYearPlan: existingPlan.is_year_plan,
  };
}

async function createOrUpdateSubscription(args: {
  existingPlan: PlanRow | null;
  paymentMethodId: string;
  priceId: string;
  stripeCustomerId: string;
}): Promise<Stripe.Subscription> {
  const { existingPlan, paymentMethodId, priceId, stripeCustomerId } = args;

  if (existingPlan?.stripe_subscription_id) {
    const existingSubscription = await stripe.subscriptions.retrieve(
      existingPlan.stripe_subscription_id,
    );

    if (
      ([StripeSubscriptionStatus.canceled, StripeSubscriptionStatus.incompleteExpired] as readonly StripeSubscriptionStatus[]).includes(
        toStripeSubscriptionStatus(existingSubscription.status),
      )
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
}
