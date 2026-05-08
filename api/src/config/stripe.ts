import dotenv from 'dotenv';
import path from 'path';
import Stripe from 'stripe';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env.local') });

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(stripeKey);

export const getStripeWebhookSecret = (): string | null =>
  process.env.STRIPE_WEBHOOK_SECRET ?? null;

export default stripe;
