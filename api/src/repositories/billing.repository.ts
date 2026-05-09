import type { Queryable, BillingRow } from '#types/database';

export const insert = (
  q: Queryable,
  userId: string,
  planType: string,
  isYearPlan: boolean,
  amountCents: number,
  paymentIntentId: string | null,
) =>
  q.query(
    `INSERT INTO billing (user_id, plan_type, is_year_plan, amount_cents, stripe_payment_intent_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, planType, isYearPlan, amountCents, paymentIntentId],
  );

export const insertFromInvoice = (
  q: Queryable,
  userId: string,
  planType: string,
  isYearPlan: boolean,
  amountCents: number,
  paymentIntentId: string | null,
  invoiceId: string,
  paidAtUnix: number,
) =>
  q.query(
    `INSERT INTO billing (
       user_id, plan_type, is_year_plan, amount_cents,
       stripe_payment_intent_id, stripe_invoice_id, billed_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, TO_TIMESTAMP($7))`,
    [userId, planType, isYearPlan, amountCents, paymentIntentId, invoiceId, paidAtUnix],
  );

export const findByInvoiceId = (q: Queryable, invoiceId: string) =>
  q.query<{ billing_id: string }>(
    'SELECT billing_id FROM billing WHERE stripe_invoice_id = $1 LIMIT 1',
    [invoiceId],
  );

export const getHistory = (q: Queryable, userId: string) =>
  q.query<BillingRow>(
    `SELECT * FROM billing
     WHERE user_id = $1 AND billed_at >= NOW() - INTERVAL '2 years'
     ORDER BY billed_at DESC`,
    [userId],
  );
