import { useQuery } from '@tanstack/react-query';
import { apiRoutes } from '#types/shared/api-route';
import { BillingResponse } from '#types/shared/response';
import { queryApi } from '~lib/api';
import { queryKeys } from '~types/lib/tanstack-query/query-keys';

export function useBillingHistoryQuery(userId: string | null | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.billing.history(userId) : ['billing', 'history', null],
    queryFn: () => queryApi<BillingResponse[]>(apiRoutes.billing.history(userId!)),
    enabled: !!userId,
  });
}
