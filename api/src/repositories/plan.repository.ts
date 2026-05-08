import type { Queryable, PlanRow } from '#types/database';
import { Plan } from '#types/shared/enum/plan';
import { RenewOn } from '#types/shared/enum/renew-on';
import { StripeSubscriptionStatus } from '#types/enum/stripe';

export function findByUserId(q: Queryable, userId: string) {
  return q.query<PlanRow>('SELECT * FROM plans WHERE user_id = $1 LIMIT 1', [userId]);
}

export function findStatusByUserId(
  q: Queryable,
  userId: string,
) {
  return q.query<Pick<PlanRow, 'plan_type' | 'subscription_status'>>(
    'SELECT plan_type, subscription_status FROM plans WHERE user_id = $1 LIMIT 1',
    [userId],
  );
}

export function upsert(
  q: Queryable,
  args: {
    userId: string;
    planType: Plan;
    isYearPlan: boolean;
    renewOn: RenewOn | null;
    renewDate: Date;
    priceId: string | null;
    subscriptionId: string;
    subscriptionStatus: StripeSubscriptionStatus;
    cancelAtPeriodEnd: boolean;
    startDate: Date;
    endDate: Date | null;
  },
) {
  return q.query(
    `INSERT INTO plans (
       user_id, plan_type, is_year_plan, renew_on, renew_date,
       stripe_price_id, stripe_subscription_id, subscription_status,
       cancel_at_period_end, start_date, end_date, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
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
       start_date = EXCLUDED.start_date,
       end_date = EXCLUDED.end_date,
       updated_at = NOW()`,
    [
      args.userId,
      args.planType,
      args.isYearPlan,
      args.renewOn,
      args.renewDate,
      args.priceId,
      args.subscriptionId,
      args.subscriptionStatus,
      args.cancelAtPeriodEnd,
      args.startDate,
      args.endDate,
    ],
  );
}

export function resetToNone(q: Queryable, userId: string) {
  return q.query(
    `INSERT INTO plans (user_id, plan_type, is_year_plan, renew_on, renew_date,
       stripe_price_id, stripe_subscription_id, subscription_status,
       cancel_at_period_end, start_date, end_date, updated_at)
     VALUES ($1, $2, FALSE, NULL, NOW(), NULL, NULL, $3, FALSE, NOW(), NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       plan_type = EXCLUDED.plan_type, is_year_plan = EXCLUDED.is_year_plan,
       renew_on = EXCLUDED.renew_on, renew_date = EXCLUDED.renew_date,
       stripe_price_id = EXCLUDED.stripe_price_id, stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       subscription_status = EXCLUDED.subscription_status, cancel_at_period_end = EXCLUDED.cancel_at_period_end,
       end_date = EXCLUDED.end_date, updated_at = NOW()`,
    [userId, Plan.none, StripeSubscriptionStatus.canceled],
  );
}
