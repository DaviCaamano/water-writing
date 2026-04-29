import { useMemo } from 'react';
import { Store, useStore } from '@tanstack/react-store';
import { useQueryClient } from '@tanstack/react-query';
import { queryApi } from '~lib/api';
import { LoginResponse, UserResponse } from '#types/shared/response';
import { apiRoutes } from '#types/shared/api-route';
import { queryKeys } from '~types/lib/tanstack-query/query-keys';
import { useSessionQuery } from '~lib/queries/user';

interface TokenState {
  token: string | null;
}

const tokenStore = new Store<TokenState>({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
});

function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('account_id');
  }
  tokenStore.setState(() => ({ token }));
}

function applyLoginResponse(data: LoginResponse, queryClient: ReturnType<typeof useQueryClient>) {
  localStorage.setItem('account_id', data.userId);
  queryClient.setQueryData(queryKeys.user.session, data);
  setToken(data.token);
}

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
  const { token } = useStore(tokenStore);
  const queryClient = useQueryClient();
  const { data: session } = useSessionQuery(token);

  const actions = useMemo<UserActions>(
    () => ({
      login: async (email, password) => {
        const data = await queryApi<LoginResponse>(apiRoutes.user.login(), {
          body: { email, password },
        });
        applyLoginResponse(data, queryClient);
      },

      signup: async (signupData) => {
        const data = await queryApi<LoginResponse>(apiRoutes.user.create(), { body: signupData });
        applyLoginResponse(data, queryClient);
      },

      logout: async () => {
        try {
          await queryApi(apiRoutes.user.logout());
        } finally {
          setToken(null);
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
        setToken(null);
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
