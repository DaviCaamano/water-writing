import { useMemo, useCallback } from 'react';
import { Store, useStore } from '@tanstack/react-store';
import { useQueryClient } from '@tanstack/react-query';
import { queryApi } from '~lib/api';
import { LoginResponse, UserResponse } from '#types/shared/response';
import { apiRoutes } from '#types/shared/api-route';
import { queryKeys } from '~types/lib/tanstack-query/query-keys';
import { useSessionQuery } from '~lib/queries/user';

interface AuthState {
  isAuthenticated: boolean;
}

const authStore = new Store<AuthState>({
  isAuthenticated: typeof document !== 'undefined' && document.cookie.includes('token='),
});

export interface UserActions {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (firstName: string, lastName: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  reset: () => void;
}

export function useUserStore() {
  const { isAuthenticated } = useStore(authStore);
  const queryClient = useQueryClient();
  const { data: session } = useSessionQuery(isAuthenticated);

  const actions = useMemo<UserActions>(
    () => ({
      login: async (email, password) => {
        const data = await queryApi<LoginResponse>(apiRoutes.user.login(), {
          body: { email, password },
        });
        authStore.setState(() => ({ isAuthenticated: true }));
        queryClient.setQueryData(queryKeys.user.session, data);
      },

      signup: async (signupData) => {
        const data = await queryApi<LoginResponse>(apiRoutes.user.create(), { body: signupData });
        authStore.setState(() => ({ isAuthenticated: true }));
        queryClient.setQueryData(queryKeys.user.session, data);
      },

      logout: async () => {
        try {
          await queryApi(apiRoutes.user.logout());
        } finally {
          authStore.setState(() => ({ isAuthenticated: false }));
          queryClient.clear();
        }
      },

      updateName: async (firstName, lastName) => {
        await queryApi<UserResponse>(apiRoutes.user.update(), { body: { firstName, lastName } });
        queryClient.setQueryData(queryKeys.user.session, (old: LoginResponse | undefined) =>
          old ? { ...old, firstName, lastName } : old,
        );
      },

      deleteAccount: async () => {
        await queryApi(apiRoutes.user.deleteAccount());
      },

      reset: () => {
        authStore.setState(() => ({ isAuthenticated: false }));
        queryClient.clear();
      },
    }),
    [queryClient],
  );

  return useMemo(
    () => ({
      isLoggedIn: !!session,
      userId: session?.userId ?? null,
      email: session?.email ?? '',
      firstName: session?.firstName ?? '',
      lastName: session?.lastName ?? '',
      plan: session?.plan ?? null,
      ...actions,
    }),
    [session, actions],
  );
}
