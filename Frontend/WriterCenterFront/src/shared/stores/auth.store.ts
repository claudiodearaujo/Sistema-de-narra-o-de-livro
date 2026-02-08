import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from '../types';
import { setTokens as setHttpTokens, clearTokens as clearHttpTokens } from '../api/http';

interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      setUser: (user) => 
        set({ user, isAuthenticated: true }),

      setTokens: (tokens) => {
        setHttpTokens(tokens.accessToken, tokens.refreshToken);
        set({ tokens });
      },

      login: (user, tokens) => {
        setHttpTokens(tokens.accessToken, tokens.refreshToken);
        set({ user, tokens, isAuthenticated: true });
      },

      logout: () => {
        clearHttpTokens();
        set({ user: null, tokens: null, isAuthenticated: false });
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
