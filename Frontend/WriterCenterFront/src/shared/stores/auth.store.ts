import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from '../types';
import { setTokens as setHttpTokens, clearTokens as clearHttpTokens } from '../api/http';

interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  sessionExpiresAt: number | null; // Timestamp when session expires
  
  // Actions
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isSessionValid: () => boolean;
  getSessionTimeRemaining: () => number;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      sessionExpiresAt: null,

      setUser: (user) => 
        set({ user, isAuthenticated: true }),

      setTokens: (tokens) => {
        setHttpTokens(tokens.accessToken);
        const expiresAt = Date.now() + (tokens.expiresIn * 1000);
        set({ tokens, sessionExpiresAt: expiresAt });
      },

      login: (user, tokens) => {
        setHttpTokens(tokens.accessToken);
        const expiresAt = Date.now() + (tokens.expiresIn * 1000);
        set({ user, tokens, isAuthenticated: true, sessionExpiresAt: expiresAt });
      },

      logout: () => {
        clearHttpTokens();
        set({ user: null, tokens: null, isAuthenticated: false, sessionExpiresAt: null });
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      isSessionValid: () => {
        const state = get();
        if (!state.sessionExpiresAt) return false;
        return Date.now() < state.sessionExpiresAt;
      },

      getSessionTimeRemaining: () => {
        const state = get();
        if (!state.sessionExpiresAt) return 0;
        const remaining = state.sessionExpiresAt - Date.now();
        return Math.max(0, Math.floor(remaining / 1000)); // Return seconds
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        sessionExpiresAt: state.sessionExpiresAt,
      }),
    }
  )
);
