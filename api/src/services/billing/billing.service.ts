import pool from '#config/database';
import { BillingResponse } from '#types/shared/response';
import { mapBilling } from '#utils/user/map-user';
import * as billingRepo from '#repositories/billing.repository';

export async function getBillingHistory(userId: string): Promise<BillingResponse[]> {
  const result = await billingRepo.getHistory(pool, userId);
  return result.rows.map(mapBilling);
}
