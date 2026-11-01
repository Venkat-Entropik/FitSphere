import { create } from 'zustand';

import { notifySuccess } from '@/utils/haptics';

import type {
  ActiveSession,
  ActiveSessionTemplate,
  RestTimer,
} from '@/features/workouts/types/workout.types';
import {
  adjustActiveSet,
  DEFAULT_REST_SECONDS,
  KG_STEP,
  logActiveSet,
  REST_EXTENSION_SECONDS,
} from '@/features/workouts/utils/workout.logic';

interface ActiveWorkoutState {
  session: ActiveSession | null;
  rest: RestTimer | null;
  start: (template: ActiveSessionTemplate, now?: number) => void;
  adjustWeight: (direction: 1 | -1) => void;
  adjustReps: (direction: 1 | -1) => void;
  logSet: (now?: number) => void;
  addRest: (seconds?: number) => void;
  skipRest: () => void;
  finish: () => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>()((set, get) => ({
  session: null,
  rest: null,

  start: (template, now = Date.now()) => {
    const { rest, ...session } = template;
    set({
      session,
      rest: rest
        ? { totalSeconds: rest.totalSeconds, endsAt: now + rest.remainingSeconds * 1000 }
        : null,
    });
  },

  adjustWeight: (direction) => {
    const { session } = get();
    if (session) set({ session: adjustActiveSet(session, { kg: KG_STEP * direction }) });
  },

  adjustReps: (direction) => {
    const { session } = get();
    if (session) set({ session: adjustActiveSet(session, { reps: direction }) });
  },

  logSet: (now = Date.now()) => {
    const { session } = get();
    if (!session) return;
    set({
      session: logActiveSet(session),
      rest: { totalSeconds: DEFAULT_REST_SECONDS, endsAt: now + DEFAULT_REST_SECONDS * 1000 },
    });
    notifySuccess();
  },

  addRest: (seconds = REST_EXTENSION_SECONDS) => {
    const { rest } = get();
    if (rest) {
      set({
        rest: { totalSeconds: rest.totalSeconds + seconds, endsAt: rest.endsAt + seconds * 1000 },
      });
    }
  },

  skipRest: () => set({ rest: null }),

  finish: () => set({ session: null, rest: null }),
}));
