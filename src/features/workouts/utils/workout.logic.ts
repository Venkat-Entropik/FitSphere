import type { ActiveSession, SessionExercise, WorkoutSet } from '../types/workout.types';

export const KG_STEP = 2.5;
export const DEFAULT_REST_SECONDS = 90;
export const REST_EXTENSION_SECONDS = 30;

export const currentExercise = (s: ActiveSession): SessionExercise | undefined =>
  s.exercises[s.currentExerciseIndex];

export const nextExercise = (s: ActiveSession): SessionExercise | undefined =>
  s.exercises[s.currentExerciseIndex + 1];

export const activeSet = (e: SessionExercise): WorkoutSet | undefined =>
  e.sets.find((set) => set.status === 'active');

const doneSets = (s: ActiveSession) =>
  s.exercises.flatMap((e) => e.sets).filter((set) => set.status === 'done');

export const completedSetCount = (s: ActiveSession): number =>
  s.priorSetsCompleted + doneSets(s).length;

export const totalSetCount = (s: ActiveSession): number =>
  s.priorSetsCompleted + s.exercises.reduce((n, e) => n + e.sets.length, 0);

/** Total tonnage lifted: sum of kg × reps over every completed set. */
export const sessionVolumeKg = (s: ActiveSession): number =>
  s.priorVolumeKg + doneSets(s).reduce((sum, set) => sum + set.kg * set.reps, 0);

export const isSessionComplete = (s: ActiveSession): boolean =>
  s.exercises.every((e) => e.sets.every((set) => set.status === 'done'));

function updateActiveSet(s: ActiveSession, update: (set: WorkoutSet) => WorkoutSet): ActiveSession {
  const exercise = currentExercise(s);
  if (!exercise) return s;
  const sets = exercise.sets.map((set) => (set.status === 'active' ? update(set) : set));
  return replaceCurrentExercise(s, { ...exercise, sets });
}

function replaceCurrentExercise(s: ActiveSession, exercise: SessionExercise): ActiveSession {
  const exercises = s.exercises.map((e, i) => (i === s.currentExerciseIndex ? exercise : e));
  return { ...s, exercises };
}

const roundToStep = (n: number) => Math.round(n * 100) / 100;

/** Quick-adjust steppers: weight never goes below 0, reps never below 1. */
export function adjustActiveSet(
  s: ActiveSession,
  delta: { kg?: number; reps?: number },
): ActiveSession {
  return updateActiveSet(s, (set) => ({
    ...set,
    kg: Math.max(0, roundToStep(set.kg + (delta.kg ?? 0))),
    reps: Math.max(1, set.reps + (delta.reps ?? 0)),
  }));
}

/**
 * Completes the active set (flagging a PR if it beats the exercise's best weight),
 * activates the next set, and moves to the next exercise once all sets are done.
 */
export function logActiveSet(s: ActiveSession): ActiveSession {
  const exercise = currentExercise(s);
  const set = exercise && activeSet(exercise);
  if (!exercise || !set) return s;

  const isPersonalRecord = set.kg > exercise.personalBestKg;
  let activated = false;
  const sets = exercise.sets.map((candidate) => {
    if (candidate.number === set.number) {
      return {
        ...candidate,
        status: 'done' as const,
        isPersonalRecord: candidate.isPersonalRecord || isPersonalRecord,
      };
    }
    if (!activated && candidate.status === 'upcoming') {
      activated = true;
      return { ...candidate, status: 'active' as const };
    }
    return candidate;
  });

  const updated = replaceCurrentExercise(s, {
    ...exercise,
    personalBestKg: isPersonalRecord ? set.kg : exercise.personalBestKg,
    startBestKg: exercise.startBestKg ?? exercise.personalBestKg,
    sets,
  });

  const exerciseFinished = !activated;
  const hasNext = s.currentExerciseIndex < s.exercises.length - 1;
  if (exerciseFinished && hasNext) {
    return activateFirstSet({ ...updated, currentExerciseIndex: s.currentExerciseIndex + 1 });
  }
  return updated;
}

/**
 * Reopens a logged set of the current exercise so its weight and reps can be corrected, then logged
 * again. The set being worked on goes back to "upcoming"; PR flags are recalculated when it is re-logged.
 */
export function reopenSet(s: ActiveSession, setNumber: number): ActiveSession {
  const exercise = currentExercise(s);
  const target = exercise?.sets.find((x) => x.number === setNumber);
  if (!exercise || !target || target.status !== 'done') return s;

  const sets = exercise.sets.map((x) => {
    if (x.number === setNumber) return { ...x, status: 'active' as const, isPersonalRecord: false };
    if (x.status === 'active') return { ...x, status: 'upcoming' as const };
    return x;
  });
  // Put the exercise's best weight back to what it was before this set, or the best of the others.
  const bestOfOthers = Math.max(
    exercise.startBestKg ?? exercise.personalBestKg,
    ...sets.filter((x) => x.status === 'done').map((x) => x.kg),
  );
  return replaceCurrentExercise(s, {
    ...exercise,
    personalBestKg: target.isPersonalRecord ? bestOfOthers : exercise.personalBestKg,
    sets,
  });
}

function activateFirstSet(s: ActiveSession): ActiveSession {
  const exercise = currentExercise(s);
  if (!exercise || activeSet(exercise)) return s;
  let activated = false;
  const sets = exercise.sets.map((set) => {
    if (!activated && set.status === 'upcoming') {
      activated = true;
      return { ...set, status: 'active' as const };
    }
    return set;
  });
  return replaceCurrentExercise(s, { ...exercise, sets });
}

export const formatClock = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const sec = safe % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export const formatKg = (kg: number): string => (Number.isInteger(kg) ? String(kg) : kg.toFixed(1));

export const formatVolume = (kg: number): string => Math.round(kg).toLocaleString('en-US');

export function restRemainingSeconds(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

/** A session left open this long is almost certainly forgotten, not still in progress. */
export const STALE_SESSION_MS = 8 * 60 * 60 * 1000;

/** When the workout timer started, or null if it is off. Older saved sessions had no setting and ran from the start. */
export const timerStart = (
  session: Pick<ActiveSession, 'startedAt' | 'timerStartedAt'>,
): number | null =>
  session.timerStartedAt === undefined ? session.startedAt : session.timerStartedAt;
