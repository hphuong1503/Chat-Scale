import { create } from 'zustand';
import type { User } from '../types';

interface AuthStoreState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (access: string, refresh: string, user: User) => void;
  updateAccessToken: (access: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  setAuth: (accessToken, refreshToken, user) =>
    set({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
    }),
  updateAccessToken: (accessToken) =>
    set((state) => ({
      ...state,
      accessToken,
      isAuthenticated: Boolean(accessToken),
    })),
  logout: () =>
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    }),
}));
