import Stripe from 'stripe';
import pool from '#config/database';
import logger from '#config/logger';
import stripe from '#config/stripe';
import { withTransaction } from '#utils/database/with-transaction';
import {
  getStoredPlanType,
  inferPlanTypeFromPriceId,
  inferRenewOnFromSubscription,
  inferYearPlanFromSubscription,
  syncPlanSnapshot,
} from '#services/stripe/subscription-sync.service';
import type { PlanRow, Queryable, UserRow } from '#types/database';
import * as userRepo from '#repositories/user.repository';
import * as planRepo from '#repositories/plan.repository';
import * as billingRepo from '#repositories/billing.repository';

export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await syncFromSubscriptionEvent(event.data.object as Stripe.Subscription);
      return;
    }
    case 'invoice.paid': {
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      return;
    }
    case 'invoice.payment_failed': {
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      return;
    }
    default:
      logger.debug({ eventType: event.type }, 'Ignoring unsupported Stripe webhook event');
  }
}

async function syncFromSubscriptionEvent(subscription: Stripe.Subscription): Promise<void> {
  const user = await findUserByStripeCustomerId(getCustomerId(subscription.customer));
  if (!user) return;

  await withTransaction(async (client) => {
    const existingPlan = await getExistingPlan(client, user.user_id);
    const priceId = subscription.items.data[0]?.price?.id ?? existingPlan?.stripe_price_id ?? null;
    const planType = inferPlanTypeFromPriceId(priceId, getStoredPlanType(existingPlan));

    await syncPlanSnapshot(client, {
      userId: user.user_id,
      planType,
      subscription,
      renewOn: inferRenewOnFromSubscription(subscription),
      yearPlan: inferYearPlanFromSubscription(subscription),
    });
  });

  logger.info(
    { userId: user.user_id, event: 'customer.subscription' },
    'Synced subscription snapshot from Stripe',
  );
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const customerId = getCustomerId(invoice.customer);
  const subscriptionId = getSubscriptionId(invoice.subscription);
  if (!customerId || !subscriptionId) return;

  const user = await findUserByStripeCustomerId(customerId);
  if (!user) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['latest_invoice.payment_intent'],
  });

  await withTransaction(async (client) => {
    const existingPlan = await getExistingPlan(client, user.user_id);
    const priceId = invoice.lines.data[0]?.price?.id ?? existingPlan?.stripe_price_id ?? null;
    const planType = inferPlanTypeFromPriceId(priceId, getStoredPlanType(existingPlan));

    await syncPlanSnapshot(client, {
      userId: user.user_id,
      planType,
      subscription,
      renewOn: inferRenewOnFromSubscription(subscription),
      yearPlan: inferYearPlanFromSubscription(subscription),
    });

    const existingBilling = await billingRepo.findByInvoiceId(client, invoice.id);

    if (existingBilling.rows.length === 0) {
      await billingRepo.insertFromInvoice(
        client,
        user.user_id,
        planType,
        inferYearPlanFromSubscription(subscription),
        invoice.amount_paid,
        getPaymentIntentId(invoice.payment_intent),
        invoice.id,
        invoice.status_transitions.paid_at ?? invoice.created,
      );
    }
  });

  logger.info({ userId: user.user_id, invoiceId: invoice.id }, 'Synced paid invoice from Stripe');
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = getCustomerId(invoice.customer);
  const subscriptionId = getSubscriptionId(invoice.subscription);
  if (!customerId || !subscriptionId) return;

  const user = await findUserByStripeCustomerId(customerId);
  if (!user) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['latest_invoice.payment_intent'],
  });

  await withTransaction(async (client) => {
    const existingPlan = await getExistingPlan(client, user.user_id);
    const priceId = subscription.items.data[0]?.price?.id ?? existingPlan?.stripe_price_id ?? null;
    const planType = inferPlanTypeFromPriceId(priceId, getStoredPlanType(existingPlan));

    await syncPlanSnapshot(client, {
      userId: user.user_id,
      planType,
      subscription,
      renewOn: inferRenewOnFromSubscription(subscription),
      yearPlan: inferYearPlanFromSubscription(subscription),
    });
  });

  logger.info(
    { userId: user.user_id, invoiceId: invoice.id },
    'Synced failed invoice status from Stripe',
  );
}

async function findUserByStripeCustomerId(customerId: string | null): Promise<UserRow | null> {
  if (!customerId) return null;
  const result = await userRepo.findByStripeCustomerId(pool, customerId);
  return result.rows[0] ?? null;
}

async function getExistingPlan(
  client: Queryable,
  userId: string,
): Promise<PlanRow | null> {
  const result = await planRepo.findByUserId(client, userId);
  return result.rows[0] ?? null;
}

function getCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) return null;
  return typeof customer === 'string' ? customer : customer.id;
}

function getSubscriptionId(subscription: string | Stripe.Subscription | null): string | null {
  if (!subscription) return null;
  return typeof subscription === 'string' ? subscription : subscription.id;
}

function getPaymentIntentId(
  paymentIntent: string | Stripe.PaymentIntent | null | undefined,
): string | null {
  if (!paymentIntent) return null;
  return typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id;
}
