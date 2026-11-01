import { Platform } from 'react-native';
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

interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

const native: KeyValueStore = {
  get: (key) => SecureStore.getItemAsync(key),
  set: (key, value) => SecureStore.setItemAsync(key, value),
  remove: (key) => SecureStore.deleteItemAsync(key),
};

/**
 * expo-secure-store has no web implementation. On web (development/preview only) tokens fall back to
 * localStorage, which is *not* hardware-backed — native builds always use the Keychain/Keystore.
 */
const web: KeyValueStore = {
  get: async (key) => globalThis.localStorage?.getItem(key) ?? null,
  set: async (key, value) => globalThis.localStorage?.setItem(key, value),
  remove: async (key) => globalThis.localStorage?.removeItem(key),
};

const store = (): KeyValueStore => (Platform.OS === 'web' ? web : native);

export const secureStorage = {
  async getTokens(): Promise<StoredTokens | null> {
    const kv = store();
    const [accessToken, refreshToken] = await Promise.all([
      kv.get(KEYS.accessToken),
      kv.get(KEYS.refreshToken),
    ]);
    return accessToken ? { accessToken, refreshToken } : null;
  },

  async setTokens(tokens: StoredTokens): Promise<void> {
    const kv = store();
    await kv.set(KEYS.accessToken, tokens.accessToken);
    if (tokens.refreshToken) await kv.set(KEYS.refreshToken, tokens.refreshToken);
    else await kv.remove(KEYS.refreshToken);
  },

  async clearTokens(): Promise<void> {
    const kv = store();
    await Promise.all([kv.remove(KEYS.accessToken), kv.remove(KEYS.refreshToken)]);
  },
};
