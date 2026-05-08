import { mockPool } from '#__tests__/constants/mock-database';
import { getBillingHistory } from '#services/billing/billing.service';
import {
  MOCK_BILLING_RESPONSE,
  MOCK_BILLING_ROW,
  MOCK_USER_ID,
} from '#__tests__/constants/mock-user';
import { mockClear } from '#__tests__/utils/test-wrappers';

describe(
  'BillingService',
  mockClear(() => {
    it('should return billing history for a user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [MOCK_BILLING_ROW] });
      const result = await getBillingHistory(MOCK_USER_ID);
      expect(result).toEqual([MOCK_BILLING_RESPONSE]);
    });

    it('should return an empty array when user has no billing records', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      const result = await getBillingHistory(MOCK_USER_ID);
      expect(result).toEqual([]);
    });
  }),
);
