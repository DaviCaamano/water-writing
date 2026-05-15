import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryApi } from '~lib/api';
import { LoginResponse } from '#types/shared/response';
import { apiRoutes } from '#types/shared/api-route';
import { queryKeys } from '~types/lib/tanstack-query/query-keys';

export type UseSessionQuery = UseQueryResult<LoginResponse | null>;
export const useSessionQuery = (enabled: boolean = true): UseSessionQuery =>
  useQuery({
    queryKey: queryKeys.user.session,
    queryFn: () => queryApi<LoginResponse>(apiRoutes.user.session()),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
