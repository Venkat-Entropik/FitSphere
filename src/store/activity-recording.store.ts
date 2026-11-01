import { create } from 'zustand';

import type {
  ActivityKind,
  ActivitySnapshot,
  GpsPoint,
} from '@/features/activities/types/activity.types';

export type RecordingStatus = 'idle' | 'recording' | 'paused';

interface ActivityRecordingState {
  status: RecordingStatus;
  kind: ActivityKind;
  startedAt: number | null;
  /** Total time spent paused (ms), excluding the current pause. */
  pausedMs: number;
  pausedAt: number | null;
  points: GpsPoint[];
  lapCount: number;
  /** The most recent finished (real, recorded) activity. */
  lastSummary: ActivitySnapshot | null;
  setKind: (kind: ActivityKind) => void;
  start: (now?: number) => void;
  addPoint: (point: GpsPoint) => void;
  pause: (now?: number) => void;
  resume: (now?: number) => void;
  markLap: () => void;
  finish: (summary: ActivitySnapshot) => void;
}

/** Elapsed seconds excluding pauses. */
export function elapsedSeconds(
  s: Pick<ActivityRecordingState, 'startedAt' | 'pausedMs' | 'pausedAt'>,
  now: number,
): number {
  if (s.startedAt === null) return 0;
  const currentPause = s.pausedAt === null ? 0 : now - s.pausedAt;
  return Math.max(0, (now - s.startedAt - s.pausedMs - currentPause) / 1000);
}

export const useActivityRecordingStore = create<ActivityRecordingState>()((set, get) => ({
  status: 'idle',
  kind: 'run',
  startedAt: null,
  pausedMs: 0,
  pausedAt: null,
  points: [],
  lapCount: 0,
  lastSummary: null,

  setKind: (kind) => {
    if (get().status === 'idle') set({ kind });
  },

  start: (now = Date.now()) =>
    set({
      status: 'recording',
      startedAt: now,
      pausedMs: 0,
      pausedAt: null,
      points: [],
      lapCount: 0,
    }),

  addPoint: (point) => {
    if (get().status === 'recording') set((s) => ({ points: [...s.points, point] }));
  },

  pause: (now = Date.now()) => {
    if (get().status === 'recording') set({ status: 'paused', pausedAt: now });
  },

  resume: (now = Date.now()) => {
    const { status, pausedAt, pausedMs } = get();
    if (status === 'paused' && pausedAt !== null) {
      set({ status: 'recording', pausedAt: null, pausedMs: pausedMs + (now - pausedAt) });
    }
  },

  markLap: () => {
    if (get().status === 'recording') set((s) => ({ lapCount: s.lapCount + 1 }));
  },

  finish: (summary) =>
    set({
      status: 'idle',
      startedAt: null,
      pausedMs: 0,
      pausedAt: null,
      points: [],
      lapCount: 0,
      lastSummary: summary,
    }),
}));
