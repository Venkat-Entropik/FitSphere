import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AuthUser } from '@/features/authentication/types/auth.types';
import { zustandAsyncStorage } from '@/services/storage/app-storage';
import { secureStorage, type StoredTokens } from '@/services/storage/secure-storage';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  /** Non-sensitive profile of the signed-in user (id, name, email). Tokens live only in SecureStore. */
  user: AuthUser | null;
  /** Reads persisted tokens from SecureStore; call once on app start. */
  hydrate: () => Promise<void>;
  signIn: (tokens: StoredTokens, user: AuthUser) => Promise<void>;
  setUser: (user: AuthUser) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      status: 'loading',
      user: null,

      hydrate: async () => {
        try {
          const tokens = await secureStorage.getTokens();
          set({ status: tokens ? 'signedIn' : 'signedOut' });
        } catch {
          set({ status: 'signedOut' });
        }
      },

      signIn: async (tokens, user) => {
        await secureStorage.setTokens(tokens);
        set({ status: 'signedIn', user });
      },

      setUser: (user) => set({ user }),

      signOut: async () => {
        await secureStorage.clearTokens();
        set({ status: 'signedOut', user: null });
      },
    }),
    {
      name: 'fitsphere.auth',
      storage: zustandAsyncStorage,
      version: 1,
      // Only the user's display profile is persisted; status is re-derived from SecureStore on launch.
      partialize: ({ user }) => ({ user }),
    },
  ),
);
