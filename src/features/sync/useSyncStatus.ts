import { useMemo } from 'react';

import { env } from '@/config/env';
import { DEMO_USER_ID } from '@/features/authentication/demo';
import { failedFor, pendingFor, useOutbox, useSyncStatusStore } from '@/services/sync';
import { useAuthStore } from '@/store/auth.store';

/**
 * What the user needs to know, in one word:
 * synced (all good), syncing (sending now), offline (no connection), waiting (online but the server
 * hasn't answered; we keep trying), attention (the server refused something and needs a decision).
 */
export type SyncState = 'synced' | 'syncing' | 'offline' | 'waiting' | 'attention';

export function useSyncStatus() {
  const userId = useAuthStore((s) => (s.status === 'signedIn' ? (s.user?.id ?? null) : null));
  const items = useOutbox((s) => s.items);
  const online = useSyncStatusStore((s) => s.online);
  const syncing = useSyncStatusStore((s) => s.syncing);
  const unreachable = useSyncStatusStore((s) => s.unreachable);
  const lastSyncedAt = useSyncStatusStore((s) => s.lastSyncedAt);

  return useMemo(() => {
    const enabled = !env.useMocks && userId !== null && userId !== DEMO_USER_ID;
    const pending = enabled ? pendingFor(items, userId) : [];
    const failed = enabled ? failedFor(items, userId) : [];
    let state: SyncState = 'synced';
    if (failed.length > 0) state = 'attention';
    else if (!online || unreachable === 'network') state = 'offline';
    else if (pending.length > 0 && unreachable === 'server') state = 'waiting';
    else if (syncing || pending.length > 0) state = 'syncing';
    return {
      enabled,
      state,
      pending,
      failed,
      online: online && unreachable !== 'network',
      lastSyncedAt,
    };
  }, [items, userId, online, syncing, unreachable, lastSyncedAt]);
}
