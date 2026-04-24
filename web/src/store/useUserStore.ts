import { useMemo } from 'react';
import { Store, useStore } from '@tanstack/react-store';
import { api } from '@/lib/api';
import { LoginResponse } from '@/api/types/response';
import { UserState } from '@/types/state';

export interface UserActions {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (firstName: string, lastName: string) => Promise<void>;
  updateGenres: (genres: string[]) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshSession: () => Promise<void>;
  reset: () => void;
}

function createInitialUserState(): UserState {
  return {
    email: '',
    firstName: '',
    isLoggedIn: false,
    lastName: '',
    legacy: [],
    plan: null,
    token: null,
    userId: null,
  };
}

function applyLoginResponse(data: LoginResponse) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('account_id', data.userId);

  return {
    email: data.email,
    firstName: data.firstName,
    isLoggedIn: true,
    lastName: data.lastName,
    legacy: data.legacy,
    plan: data.plan,
    token: data.token,
    userId: data.userId,
  };
}

const userStore = new Store<UserState>(createInitialUserState());

const userActions: UserActions = {
  login: async (email, password) => {
    const data = await api<LoginResponse>(
      '/user/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false,
    );
    userStore.setState(applyLoginResponse(data));
  },

  signup: async (signupData) => {
    const data = await api<LoginResponse>(
      '/user/signup',
      {
        method: 'POST',
        body: JSON.stringify(signupData),
      },
      false,
    );
    userStore.setState(applyLoginResponse(data));
  },

  logout: async () => {
    try {
      await api('/users/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('account_id');
      userStore.setState(createInitialUserState());
    }
  },

  updateName: async (firstName, lastName) => {
    await api('/user', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName }),
    });
    userStore.setState((state) => ({ ...state, firstName, lastName }));
  },

  updateGenres: async (genres) => {
    await api('/user/genres', {
      method: 'POST',
      body: JSON.stringify({ genres }),
    });
    userStore.setState((state) => ({ ...state, genres }));
  },

  deleteAccount: async () => {
    await api('/user/deleteme', { method: 'DELETE' });
  },

  refreshSession: async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('account_id');
    if (!token || !userId) return;

    try {
      const data = await api<LoginResponse>(
        `/user?token=${encodeURIComponent(token)}&account_id=${encodeURIComponent(userId)}`,
        { method: 'GET' },
        false,
      );
      userStore.setState(applyLoginResponse(data));
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('account_id');
    }
  },

  reset: () => {
    userStore.setState(createInitialUserState());
  },
};

type UserStore = UserState & UserActions;

export function useUserStore(): UserStore {
  const state = useStore(userStore, (currentState) => currentState);

  return useMemo(
    () => ({
      ...state,
      ...userActions,
    }),
    [state],
  );
}
