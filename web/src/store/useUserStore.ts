import { create } from 'zustand';
import { api } from '@/lib/api';

interface LoginResponse {
  accountId: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  subscription: 'none' | 'pro' | 'max';
  documentNames: string[];
  genres: string[];
  token: string;
}

interface UserState {
  accountId: string | null;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  subscription: 'none' | 'pro' | 'max';
  documentNames: string[];
  genres: string[];
  token: string | null;
  isLoggedIn: boolean;

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

const initialState = {
  accountId: null as string | null,
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  subscription: 'none' as const,
  documentNames: [] as string[],
  genres: [] as string[],
  token: null as string | null,
  isLoggedIn: false,
};

function applyLoginResponse(data: LoginResponse) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('account_id', data.accountId);

  return {
    accountId: data.accountId,
    username: data.username,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    subscription: data.subscription,
    documentNames: data.documentNames,
    genres: data.genres || [],
    token: data.token,
    isLoggedIn: true,
  };
}

export const useUserStore = create<UserState>((set) => ({
  ...initialState,

  login: async (email, password) => {
    const data = await api<LoginResponse>(
      '/user/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false,
    );
    set(applyLoginResponse(data));
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
    set(applyLoginResponse(data));
  },

  logout: async () => {
    try {
      await api('/users/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('account_id');
      set(initialState);
    }
  },

  updateName: async (firstName, lastName) => {
    await api('/user', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName }),
    });
    set({ firstName, lastName });
  },

  updateGenres: async (genres) => {
    await api('/user/genres', {
      method: 'POST',
      body: JSON.stringify({ genres }),
    });
    set({ genres });
  },

  deleteAccount: async () => {
    await api('/user/deleteme', { method: 'DELETE' });
  },

  refreshSession: async () => {
    const token = localStorage.getItem('token');
    const accountId = localStorage.getItem('account_id');
    if (!token || !accountId) return;

    try {
      const data = await api<LoginResponse>(
        `/user?token=${encodeURIComponent(token)}&account_id=${encodeURIComponent(accountId)}`,
        { method: 'GET' },
        false,
      );
      set(applyLoginResponse(data));
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('account_id');
    }
  },

  reset: () => set(initialState),
}));
