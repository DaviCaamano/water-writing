import pool from '#config/database';
import { BillingResponse } from '#types/shared/response';
import * as billingRepo from '#repositories/billing.repository';
import { mapBilling } from '#utils/database/map-db-row';

export const getBillingHistory = async (userId: string): Promise<BillingResponse[]> => {
  const result = await billingRepo.getHistory(pool, userId);
  return result.rows.map(mapBilling);
};
