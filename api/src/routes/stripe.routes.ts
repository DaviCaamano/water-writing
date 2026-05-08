import express, { Router } from 'express';
import Stripe from 'stripe';
import stripe, { getStripeWebhookSecret } from '#config/stripe';
import logger from '#config/logger';
import { handleStripeWebhook } from '#services/stripe/stripe-webhook.service';

// ------------------------==== DO NOT EXPOSE TO FRONTEND ====---------------------------

const router = Router();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res): Promise<void> => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = getStripeWebhookSecret();
    if (!webhookSecret) {
      logger.error('Missing STRIPE_WEBHOOK_SECRET for Stripe webhook handling');
      res.status(500).json({ error: 'Stripe webhook secret is not configured' });
      return;
    }

    if (!signature || Array.isArray(signature)) {
      res.status(400).json({ error: 'Missing Stripe signature header' });
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
      logger.warn({ err: error }, 'Stripe webhook signature verification failed');
      res.status(400).json({ error: 'Invalid Stripe webhook signature' });
      return;
    }

    await handleStripeWebhook(event);
    res.json({ received: true });
  },
);

export default router;
