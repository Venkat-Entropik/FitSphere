import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandAsyncStorage } from '@/services/storage/app-storage';

import type { QueuedChange, SyncChange } from './types';

interface OutboxState {
  items: QueuedChange[];
  enqueue: (userId: string, change: SyncChange, now?: number) => QueuedChange;
  remove: (id: string) => void;
  recordAttempt: (id: string, error: string) => void;
  markFailed: (id: string, error: string) => void;
  /** Puts a refused change back in the queue, for the user to try again. */
  retry: (id: string) => void;
  clearUser: (userId: string) => void;
}

const newId = (now: number) => `${now}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Changes made on this device that the server has not confirmed yet. Persisted, so nothing is lost if
 * the app is closed while offline. Changes keep the account that made them: another account signing
 * in on the same phone never sends them.
 */
export const useOutbox = create<OutboxState>()(
  persist(
    (set) => ({
      items: [],
      enqueue: (userId, change, now = Date.now()) => {
        const item: QueuedChange = {
          id: newId(now),
          userId,
          createdAt: now,
          change,
          status: 'pending',
          attempts: 0,
        };
        set((s) => ({ items: [...s.items, item] }));
        return item;
      },
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      recordAttempt: (id, error) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, attempts: i.attempts + 1, error } : i)),
        })),
      markFailed: (id, error) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, status: 'failed', attempts: i.attempts + 1, error } : i,
          ),
        })),
      retry: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, status: 'pending', attempts: 0, error: undefined } : i,
          ),
        })),
      clearUser: (userId) => set((s) => ({ items: s.items.filter((i) => i.userId !== userId) })),
    }),
    { name: 'fitsphere.outbox', storage: zustandAsyncStorage, version: 1 },
  ),
);

export const pendingFor = (items: readonly QueuedChange[], userId: string) =>
  items.filter((i) => i.userId === userId && i.status === 'pending');

export const failedFor = (items: readonly QueuedChange[], userId: string) =>
  items.filter((i) => i.userId === userId && i.status === 'failed');
