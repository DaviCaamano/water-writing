import bcrypt from 'bcrypt';
import Stripe from 'stripe';
import pool from '#config/database';
import stripe from '#config/stripe';
import logger from '#config/logger';
import type { CreateUserBody, UpdateUserBody, SubscribeBody } from '#schemas/user.schemas';
import { PlanRow, UserRow } from '#types/database';
import { EmailTakenError, StripePaymentFailed } from '#constants/error/custom-errors';
import { SubscriptionResponse, UserResponse } from '#types/shared/response';
import { Plan } from '#types/shared/enum/plan';
import {
  assertBillableSubscription,
  extractPaymentIntentId,
  getAmountCentsFromSubscription,
  getStoredPlanType,
  getStripePriceId,
  getSubscriptionDate,
  isAccessibleSubscriptionStatus,
  syncPlanSnapshot,
  toStripeSubscriptionStatus,
} from '#services/stripe/subscription-sync.service';
import { withTransaction } from '#utils/database/with-transaction';
import { PoolClient } from 'pg';
import { RenewOn } from '#types/shared/enum/renew-on';
import { StripeSubscriptionStatus } from '#types/enum/stripe';

const SALT_ROUNDS = 12;

// Create user
export async function createUser(data: CreateUserBody): Promise<void> {
  const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [data.email]);
  if (existing.rows.length > 0) throw new EmailTakenError();

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  await pool.query(
    `INSERT INTO users 
    (first_name, last_name, email, password_hash) 
    VALUES ($1, $2, $3, $4)`,
    [data.firstName, data.lastName, data.email, passwordHash],
  );
  logger.info({ email: data.email }, 'User account created');
}

// Update user
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
      await client.query(
        `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${paramIdx}`,
        values,
      );
    }

    const userQuery = client.query<UserRow>('SELECT * FROM users WHERE user_id = $1', [userId]);
    const planQuery = client.query<PlanRow>(
      `SELECT plan_type, subscription_status
       FROM plans
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );

    const [userResult, planResult] = await Promise.all([userQuery, planQuery]);
    const user = userResult.rows[0];
    logger.info({ userId, fields: Object.keys(data) }, 'User updated');

    return {
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      plan:
        planResult.rows.length > 0 &&
        isAccessibleSubscriptionStatus(planResult.rows[0].subscription_status)
          ? planResult.rows[0].plan_type
          : null,
    };
  });
};
// Delete user (GDPR / account deletion)
export async function deleteUser(userId: string) {
  // All related tables cascade-delete from users.user_id
  // await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
  // logger.info({ userId }, 'User account deleted');
  //TODO implement such that it emails me the requests users make for account deletion
  console.warn(userId, 'User account deletion requested. Not implemented yet.');
}

// Subscribe
export async function subscribe(
  userId: string,
  data: SubscribeBody,
): Promise<SubscriptionResponse> {
  return withTransaction(async (client: PoolClient) => {
    const userResult = await client.query<UserRow>('SELECT * FROM users WHERE user_id = $1', [
      userId,
    ]);
    const user = userResult.rows[0];

    const existingPlanResult = await client.query<PlanRow>(
      'SELECT * FROM plans WHERE user_id = $1',
      [userId],
    );
    const existingPlan = existingPlanResult.rows[0] ?? null;

    let stripeCustomerId = user.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
      });
      stripeCustomerId = customer.id;
      await client.query('UPDATE users SET stripe_customer_id = $1 WHERE user_id = $2', [
        stripeCustomerId,
        userId,
      ]);
    }

    if (data.planType === Plan.none) {
      return cancelSubscription(client, userId, existingPlan);
    }

    const { planType, yearPlan, paymentMethodId } = data;
    const renewOn = yearPlan ? RenewOn.yearly : RenewOn.monthly;
    const priceId = getStripePriceId(planType, yearPlan);

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

    await syncPlanSnapshot(client, {
      userId,
      planType,
      subscription,
      renewOn,
      yearPlan,
    });

    await client.query(
      `INSERT INTO billing (user_id, plan_type, is_year_plan, amount_cents, stripe_payment_intent_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, planType, yearPlan, amountCents, extractPaymentIntentId(subscription)],
    );

    logger.info(
      { userId, planType, yearPlan, amountCents, subscriptionId: subscription.id },
      existingPlan?.stripe_subscription_id ? 'Subscription updated' : 'Subscription created',
    );

    return {
      action: existingPlan?.stripe_subscription_id ? 'updated' : 'subscribed',
      amountCents,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      planType,
      renewDate: getSubscriptionDate(subscription.current_period_end),
      subscriptionStatus: toStripeSubscriptionStatus(subscription.status),
      yearPlan,
    };
  });
}

// Private helpers
async function cancelSubscription(
  client: PoolClient,
  userId: string,
  existingPlan: PlanRow | null,
): Promise<SubscriptionResponse> {
  if (!existingPlan?.stripe_subscription_id) {
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
       VALUES ($1, $2, FALSE, NULL, NOW(), NULL, NULL, $3, FALSE, NOW(), NOW(), NOW())
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
         end_date = EXCLUDED.end_date,
         updated_at = NOW()`,
      [userId, Plan.none, StripeSubscriptionStatus.canceled],
    );

    return {
      action: 'already_canceled',
      amountCents: null,
      cancelAtPeriodEnd: false,
      planType: null,
      renewDate: null,
      subscriptionStatus: StripeSubscriptionStatus.canceled,
      yearPlan: false,
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
    yearPlan: existingPlan.is_year_plan,
  });

  logger.info({ userId, subscriptionId: subscription.id }, 'Subscription cancellation scheduled');

  return {
    action: 'cancellation_scheduled',
    amountCents: null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    planType: getStoredPlanType(existingPlan),
    renewDate: getSubscriptionDate(subscription.current_period_end),
    subscriptionStatus: toStripeSubscriptionStatus(subscription.status),
    yearPlan: existingPlan.is_year_plan,
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
      [StripeSubscriptionStatus.canceled, StripeSubscriptionStatus.incompleteExpired].includes(
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
