jest.mock('#services/stripe/stripe-webhook.service');
jest.mock('#config/stripe', () => ({
  __esModule: true,
  default: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
  getStripeWebhookSecret: () => process.env.STRIPE_WEBHOOK_SECRET ?? null,
}));

import request from 'supertest';
import app from '#app';
import stripe from '#config/stripe';
import { handleStripeWebhook } from '#services/stripe/stripe-webhook.service';
import { mockClear } from '#__tests__/utils/test-wrappers';

const mockConstructEvent = stripe.webhooks.constructEvent as jest.MockedFunction<
  typeof stripe.webhooks.constructEvent
>;
const mockHandleStripeWebhook = handleStripeWebhook as jest.MockedFunction<
  typeof handleStripeWebhook
>;

const MOCK_SIGNATURE = 't=1713974400,v1=mock_signature';
const MOCK_SECRET = 'whsec_test_secret';
const MOCK_BODY_TEXT = JSON.stringify({ id: 'evt_test_123', object: 'event' });
const MOCK_EVENT = {
  id: 'evt_test_123',
  object: 'event',
  type: 'customer.subscription.updated',
  data: { object: { id: 'sub_test_123' } },
} as const;

const expectConstructEventCall = () => {
  const calls = mockConstructEvent.mock.calls;
  const [payload, signature, secret] = calls[calls.length - 1] ?? [];

  expect(Buffer.isBuffer(payload)).toBe(true);
  expect((payload as Buffer).toString('utf8')).toBe(MOCK_BODY_TEXT);
  expect(signature).toBe(MOCK_SIGNATURE);
  expect(secret).toBe(MOCK_SECRET);
};

describe(
  'POST /stripe/webhook',
  mockClear(() => {
    const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    beforeEach(() => {
      process.env.STRIPE_WEBHOOK_SECRET = MOCK_SECRET;
    });

    afterEach(() => {
      if (originalWebhookSecret === undefined) {
        delete process.env.STRIPE_WEBHOOK_SECRET;
        return;
      }

      process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
    });

    it('returns 500 when the webhook secret is not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const res = await request(app)
        .post('/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', MOCK_SIGNATURE)
        .send(MOCK_BODY_TEXT);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Stripe webhook secret is not configured');
      expect(mockConstructEvent).not.toHaveBeenCalled();
      expect(mockHandleStripeWebhook).not.toHaveBeenCalled();
    });

    it('returns 400 when the Stripe signature header is missing', async () => {
      const res = await request(app)
        .post('/stripe/webhook')
        .set('Content-Type', 'application/json')
        .send(MOCK_BODY_TEXT);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing Stripe signature header');
      expect(mockConstructEvent).not.toHaveBeenCalled();
      expect(mockHandleStripeWebhook).not.toHaveBeenCalled();
    });

    it('returns 400 when Stripe signature verification fails', async () => {
      mockConstructEvent.mockImplementationOnce(() => {
        throw new Error('invalid signature');
      });

      const res = await request(app)
        .post('/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', MOCK_SIGNATURE)
        .send(MOCK_BODY_TEXT);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid Stripe webhook signature');
      expectConstructEventCall();
      expect(mockHandleStripeWebhook).not.toHaveBeenCalled();
    });

    it('returns 200 and forwards verified Stripe events to the webhook service', async () => {
      mockConstructEvent.mockReturnValueOnce(MOCK_EVENT as never);
      mockHandleStripeWebhook.mockResolvedValueOnce();

      const res = await request(app)
        .post('/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', MOCK_SIGNATURE)
        .send(MOCK_BODY_TEXT);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
      expectConstructEventCall();
      expect(mockHandleStripeWebhook).toHaveBeenCalledWith(MOCK_EVENT);
    });
  }),
);
