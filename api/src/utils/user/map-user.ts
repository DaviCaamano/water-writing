import { BillingRow } from '#types/database';
import { BillingResponse } from '#types/shared/response';

export const mapBilling = (billing: BillingRow): BillingResponse => ({
  billingId: billing.billing_id,
  planType: billing.plan_type,
  isYearPlan: billing.is_year_plan,
  amountCents: billing.amount_cents,
  billedAt: billing.billed_at,
});
