import Stripe from 'stripe';
import { env } from '#config/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const getStripeWebhookSecret = (): string | null =>
  env.STRIPE_WEBHOOK_SECRET ?? null;

export default stripe;
