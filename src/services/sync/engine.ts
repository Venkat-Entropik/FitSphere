import NetInfo from '@react-native-community/netinfo';
import type { QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

import { env } from '@/config/env';
import { DEMO_USER_ID } from '@/features/authentication/demo';
import { toApiError } from '@/services/api/api-error';
import { dbReady, resetMockDb, useMockDb } from '@/services/mock-db/mock-db';
import { useAuthStore } from '@/store/auth.store';
import { usePreferencesStore } from '@/store/preferences.store';

import { applyChange, applyChanges, emptyLocalData } from './local-state';
import { failedFor, pendingFor, useOutbox } from './outbox.store';
import { fetchServerData } from './pull';
import { useSyncStatusStore } from './status.store';
import { sendChange } from './transport';
import type { SyncChange } from './types';

/** Why a sync run was started. Writes only send; the others also catch up with the server. */
export type SyncReason = 'write' | 'start' | 'foreground' | 'reconnect' | 'manual' | 'timer';

const RETRY_DELAYS_MS = [3_000, 10_000, 30_000, 60_000];
const FOREGROUND_PULL_EVERY_MS = 30_000;
const RETRY_WHEN_WAITING_MS = 30_000;
/** Sign-in already caught up; the listener's own start-up run shouldn't repeat it right away. */
const START_PULL_DEDUPE_MS = 10_000;

let queryClient: QueryClient | null = null;
let running: Promise<void> | null = null;
let queuedReason: SyncReason | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let consecutiveFailures = 0;
let lastPullAt = 0;
let stopListeners: (() => void) | null = null;

export const attachQueryClient = (client: QueryClient) => {
  queryClient = client;
};

/** The signed-in account whose data is mirrored, or null when sync does not apply (demo, mocks, signed out). */
export function syncUserId(): string | null {
  if (env.useMocks) return null;
  const { status, user } = useAuthStore.getState();
  return status === 'signedIn' && user && user.id !== DEMO_USER_ID ? user.id : null;
}

/**
 * Records a change: it appears in the app immediately, then goes to the server in the background.
 * With the offline demo (mocks) it only updates the on-device database.
 */
export async function commitChange(change: SyncChange): Promise<void> {
  await dbReady();
  useMockDb.setState((db) => applyChange(db, change));
  const userId = syncUserId();
  if (!userId) return;
  useOutbox.getState().enqueue(userId, change);
  void syncNow('write');
}

function clearRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
}

function scheduleRetry(delay?: number) {
  clearRetry();
  const wait = delay ?? RETRY_DELAYS_MS[Math.min(consecutiveFailures, RETRY_DELAYS_MS.length - 1)]!;
  retryTimer = setTimeout(() => void syncNow('timer'), wait);
}

const markUnreachable = (kind: string) => {
  consecutiveFailures += 1;
  useSyncStatusStore.getState().set({ unreachable: kind === 'network' ? 'network' : 'server' });
};

/** Replaces the local copy with the server's data, then re-applies changes the server has not confirmed. */
async function pull(userId: string): Promise<void> {
  const server = await fetchServerData(Date.now());
  await dbReady();
  if (syncUserId() !== userId) return;
  const { items } = useOutbox.getState();
  // Re-applied on top of the server's data so nothing the user just did flickers away.
  const unconfirmed = [...pendingFor(items, userId), ...failedFor(items, userId)].map(
    (i) => i.change,
  );
  useMockDb.setState({ ...applyChanges(server.data, unconfirmed), ownerId: userId });
  if (server.onboardingComplete) usePreferencesStore.setState({ onboardingComplete: true });
  lastPullAt = Date.now();
  void queryClient?.invalidateQueries();
}

async function run(reason: SyncReason): Promise<void> {
  const userId = syncUserId();
  if (!userId) return;
  const status = useSyncStatusStore.getState();

  // Don't wait for a timeout when the phone knows it has no connection; reconnecting triggers a run.
  if (!status.online && (reason === 'write' || reason === 'timer')) {
    status.set({ unreachable: 'network' });
    scheduleRetry(RETRY_WHEN_WAITING_MS);
    return;
  }

  status.set({ syncing: true });
  try {
    for (;;) {
      const next = pendingFor(useOutbox.getState().items, userId)[0];
      if (!next) break;
      try {
        await sendChange(next.change);
        useOutbox.getState().remove(next.id);
        consecutiveFailures = 0;
      } catch (error) {
        if (syncUserId() !== userId) return;
        const api = toApiError(error);
        // An expired session signs the user out; their changes stay queued until they sign in again.
        if (api.kind === 'unauthorized') return;
        if (api.isRetryable || api.status === 429) {
          useOutbox.getState().recordAttempt(next.id, api.message);
          markUnreachable(api.kind);
          scheduleRetry();
          return;
        }
        // The server refused it for good. Park it for the user and carry on with the rest.
        useOutbox.getState().markFailed(next.id, api.message);
      }
    }

    const wantsPull =
      (reason === 'start' && Date.now() - lastPullAt > START_PULL_DEDUPE_MS) ||
      reason === 'reconnect' ||
      reason === 'manual' ||
      (reason === 'foreground' && Date.now() - lastPullAt > FOREGROUND_PULL_EVERY_MS);
    if (wantsPull) {
      try {
        await pull(userId);
      } catch (error) {
        if (syncUserId() !== userId) return;
        const api = toApiError(error);
        if (api.kind === 'unauthorized') return;
        markUnreachable(api.kind);
        scheduleRetry();
        return;
      }
    }
    clearRetry();
    consecutiveFailures = 0;
    useSyncStatusStore.getState().set({ unreachable: null, lastSyncedAt: Date.now() });
  } finally {
    useSyncStatusStore.getState().set({ syncing: false });
  }
}

/**
 * Sends waiting changes and, for most reasons, refreshes from the server. Only one run happens at a
 * time; a request that arrives mid-run is folded into one follow-up run.
 */
export function syncNow(reason: SyncReason = 'manual'): Promise<void> {
  if (!syncUserId()) return Promise.resolve();
  if (running) {
    queuedReason = reason === 'write' && queuedReason ? queuedReason : reason;
    return running;
  }
  running = (async () => {
    try {
      await run(reason);
      while (queuedReason) {
        const next = queuedReason;
        queuedReason = null;
        await run(next);
      }
    } finally {
      running = null;
    }
  })();
  return running;
}

/**
 * Called right after sign-in: catches this device up with the account. Waits briefly so the first
 * screen has data, but never blocks sign-in on a slow server (it carries on in the background).
 */
export async function initialSync(client: QueryClient, waitMs = 12_000): Promise<void> {
  attachQueryClient(client);
  await Promise.race([
    syncNow('start'),
    new Promise<void>((resolve) => setTimeout(resolve, waitMs)),
  ]);
}

/** Starts listening for connectivity and app-foreground events. Returns nothing; call `stopSync` to end. */
export function startSync(client: QueryClient): void {
  stopSync();
  attachQueryClient(client);
  const userId = syncUserId();
  if (!userId) return;

  // A local copy that belongs to nobody (old sample data) or to another account must not be shown.
  void dbReady().then(() => {
    const db = useMockDb.getState();
    if (db.ownerId !== userId) {
      const name = useAuthStore.getState().user?.name ?? '';
      resetMockDb({ ...emptyLocalData(name), ownerId: userId });
      void queryClient?.invalidateQueries();
    }
    void syncNow('start');
  });

  const net = NetInfo.addEventListener((state) => {
    // Only the device's own connection counts. "Internet reachable" relies on a probe some networks block,
    // and real failures show up as failed requests anyway.
    const online = state.isConnected !== false;
    const wasOnline = useSyncStatusStore.getState().online;
    useSyncStatusStore.getState().set({ online });
    if (online && !wasOnline) void syncNow('reconnect');
  });
  const app = AppState.addEventListener('change', (next) => {
    if (next === 'active') void syncNow('foreground');
  });
  stopListeners = () => {
    net();
    app.remove();
  };
}

export function stopSync(): void {
  stopListeners?.();
  stopListeners = null;
  clearRetry();
  consecutiveFailures = 0;
  queuedReason = null;
}

/** The user chose to try a refused change again. */
export function retryChange(id: string): void {
  useOutbox.getState().retry(id);
  void syncNow('manual');
}

/** The user gave up on a refused change: drop it and show what the server actually has. */
export function discardChange(id: string): void {
  useOutbox.getState().remove(id);
  void syncNow('manual');
}

/** Test helper: forget in-memory sync state. */
export function resetSyncRuntime(): void {
  stopSync();
  running = null;
  lastPullAt = 0;
  useSyncStatusStore.setState({
    online: true,
    syncing: false,
    unreachable: null,
    lastSyncedAt: null,
  });
}
