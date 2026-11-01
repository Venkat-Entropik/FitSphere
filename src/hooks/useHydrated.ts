import { useSyncExternalStore } from 'react';

interface PersistApi {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void;
  };
}

/** True once a persisted Zustand store has loaded from storage (avoids flashing default state). */
export function useHydrated(store: PersistApi): boolean {
  return useSyncExternalStore(
    (notify) => store.persist.onFinishHydration(notify),
    () => store.persist.hasHydrated(),
    () => false,
  );
}
