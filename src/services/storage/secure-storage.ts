import * as SecureStore from 'expo-secure-store';

/** Sensitive credentials only (auth tokens). Everything else belongs in app-storage. */
const KEYS = {
  accessToken: 'fitsphere.accessToken',
  refreshToken: 'fitsphere.refreshToken',
} as const;

export interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
}

export const secureStorage = {
  async getTokens(): Promise<StoredTokens | null> {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(KEYS.accessToken),
      SecureStore.getItemAsync(KEYS.refreshToken),
    ]);
    return accessToken ? { accessToken, refreshToken } : null;
  },

  async setTokens(tokens: StoredTokens): Promise<void> {
    await SecureStore.setItemAsync(KEYS.accessToken, tokens.accessToken);
    if (tokens.refreshToken) {
      await SecureStore.setItemAsync(KEYS.refreshToken, tokens.refreshToken);
    } else {
      await SecureStore.deleteItemAsync(KEYS.refreshToken);
    }
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.accessToken),
      SecureStore.deleteItemAsync(KEYS.refreshToken),
    ]);
  },
};
