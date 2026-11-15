import { create } from 'zustand';

interface SyncStatusState {
  /** The device's own connection state (airplane mode, no Wi-Fi or data). Assumed true until it says otherwise. */
  online: boolean;
  /** A send or catch-up is in progress right now. */
  syncing: boolean;
  /**
   * Why the last attempt failed, if it did: `network` (no connection at all) or `server` (it answered
   * with an error or took too long, for example while a sleeping server wakes up).
   */
  unreachable: 'network' | 'server' | null;
  lastSyncedAt: number | null;
  set: (patch: Partial<Omit<SyncStatusState, 'set'>>) => void;
}

/** Live sync status for the UI. Not persisted: it describes this moment. */
export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  online: true,
  syncing: false,
  unreachable: null,
  lastSyncedAt: null,
  set: (patch) => set(patch),
}));
