import { create } from 'zustand';

import { secureStorage, type StoredTokens } from '@/services/storage/secure-storage';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  /** Reads persisted tokens from SecureStore; call once on app start. */
  hydrate: () => Promise<void>;
  signIn: (tokens: StoredTokens) => Promise<void>;
  signOut: () => Promise<void>;
}

/** Tokens live only in SecureStore; the store keeps just the derived status. */
export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',

  hydrate: async () => {
    try {
      const tokens = await secureStorage.getTokens();
      set({ status: tokens ? 'signedIn' : 'signedOut' });
    } catch {
      set({ status: 'signedOut' });
    }
  },

  signIn: async (tokens) => {
    await secureStorage.setTokens(tokens);
    set({ status: 'signedIn' });
  },

  signOut: async () => {
    await secureStorage.clearTokens();
    set({ status: 'signedOut' });
  },
}));
