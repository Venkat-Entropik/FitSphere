import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** Non-sensitive persistence (preferences, UI state). Never store credentials here. */
export const zustandAsyncStorage = createJSONStorage(() => AsyncStorage);

export const appStorage = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  set: (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value)),
  remove: (key: string) => AsyncStorage.removeItem(key),
};
