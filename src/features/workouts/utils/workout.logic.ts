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
    sets,
  });

  const exerciseFinished = !activated;
  const hasNext = s.currentExerciseIndex < s.exercises.length - 1;
  if (exerciseFinished && hasNext) {
    return activateFirstSet({ ...updated, currentExerciseIndex: s.currentExerciseIndex + 1 });
  }
  return updated;
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
  const m = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export const formatKg = (kg: number): string => (Number.isInteger(kg) ? String(kg) : kg.toFixed(1));

export const formatVolume = (kg: number): string => Math.round(kg).toLocaleString('en-US');

export function restRemainingSeconds(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}
