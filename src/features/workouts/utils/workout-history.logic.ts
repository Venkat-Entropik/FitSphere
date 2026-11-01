import type {
  ActiveSession,
  ActiveSessionTemplate,
  SessionExercise,
  WorkoutSet,
} from '../types/workout.types';
import type {
  Equipment,
  Exercise,
  MuscleGroup,
  OverloadSuggestion,
  RecordedSet,
  WorkoutPlan,
  WorkoutRecord,
} from '../types/workout-record.types';
import { completedSetCount, sessionVolumeKg } from './workout.logic';

const round1 = (n: number) => Math.round(n * 10) / 10;
const roundToStep = (n: number, step: number) => Math.round(n / step) * step;

/** Epley estimate of a one-rep max. */
export const estimateOneRepMax = (kg: number, reps: number): number =>
  reps <= 1 ? kg : round1(kg * (1 + reps / 30));

const MET_STRENGTH_TRAINING = 5;

export function estimateWorkoutKcal(durationSec: number, weightKg: number): number {
  return Math.round(MET_STRENGTH_TRAINING * weightKg * (durationSec / 3600));
}

export interface BuildRecordOptions {
  now: number;
  weightKg: number;
  catalog: readonly Exercise[];
}

/**
 * Turns a live session into the record that is saved when the athlete finishes. Only sets that were
 * actually logged are kept; skipped sets never count toward volume.
 */
export function buildWorkoutRecord(
  session: ActiveSession,
  opts: BuildRecordOptions,
): WorkoutRecord {
  const durationSec = Math.max(0, Math.round((opts.now - session.startedAt) / 1000));
  const exercises = session.exercises
    .map((e) => {
      const done = e.sets.filter((s) => s.status === 'done');
      return {
        exerciseId: e.id,
        name: e.name,
        muscleGroup:
          opts.catalog.find((c) => c.id === e.id)?.muscleGroup ?? ('chest' as MuscleGroup),
        sets: done.map<RecordedSet>((s) => ({
          kg: s.kg,
          reps: s.reps,
          isPersonalRecord: s.isPersonalRecord,
        })),
      };
    })
    .filter((e) => e.sets.length > 0);

  return {
    id: `workout-${opts.now}`,
    planId: session.planId ?? null,
    title: session.title,
    startedAt: session.startedAt,
    endedAt: opts.now,
    durationSec,
    volumeKg: Math.round(sessionVolumeKg(session)),
    setsCompleted: completedSetCount(session),
    prCount: exercises.reduce((n, e) => n + e.sets.filter((s) => s.isPersonalRecord).length, 0),
    kcal: estimateWorkoutKcal(durationSec, opts.weightKg),
    exercises,
    source: 'user',
  };
}

export interface PersonalBest {
  exerciseId: string;
  name: string;
  kg: number;
  reps: number;
  estimatedOneRepMax: number;
  achievedAt: number;
}

/** Heaviest completed set per exercise (more reps break a tie). */
export function personalBests(records: readonly WorkoutRecord[]): Map<string, PersonalBest> {
  const bests = new Map<string, PersonalBest>();
  for (const record of records) {
    for (const exercise of record.exercises) {
      for (const set of exercise.sets) {
        const current = bests.get(exercise.exerciseId);
        const better =
          !current || set.kg > current.kg || (set.kg === current.kg && set.reps > current.reps);
        if (better) {
          bests.set(exercise.exerciseId, {
            exerciseId: exercise.exerciseId,
            name: exercise.name,
            kg: set.kg,
            reps: set.reps,
            estimatedOneRepMax: estimateOneRepMax(set.kg, set.reps),
            achievedAt: record.endedAt,
          });
        }
      }
    }
  }
  return bests;
}

/** Sets from the most recent sessions that included this exercise, newest first. */
export function exerciseSessions(
  records: readonly WorkoutRecord[],
  exerciseId: string,
  limit = 3,
): RecordedSet[][] {
  return [...records]
    .sort((a, b) => b.endedAt - a.endedAt)
    .map((r) => r.exercises.find((e) => e.exerciseId === exerciseId)?.sets ?? [])
    .filter((sets) => sets.length > 0)
    .slice(0, limit);
}

/**
 * Double-progression rule:
 * - no history → starting weight
 * - every set reached the top of the rep range → add one increment, restart at the bottom
 * - two sessions in a row under the bottom of the range → deload ~10%
 * - otherwise repeat the weight and aim for one more rep
 */
export function suggestOverload(
  exercise: Exercise,
  sessions: readonly (readonly RecordedSet[])[],
): OverloadSuggestion {
  const [low, high] = exercise.repRange;
  const last = sessions[0];
  if (!last || last.length === 0) {
    return { exerciseId: exercise.id, kg: exercise.startKg, reps: low, reason: 'start' };
  }
  const kg = Math.max(...last.map((s) => s.kg));
  const atWorkingWeight = last.filter((s) => s.kg === kg);
  const minReps = Math.min(...atWorkingWeight.map((s) => s.reps));
  const maxReps = Math.max(...atWorkingWeight.map((s) => s.reps));

  if (minReps >= high) {
    return {
      exerciseId: exercise.id,
      kg: kg + exercise.incrementKg,
      reps: low,
      reason: 'progress',
    };
  }

  const missed = (sets: readonly RecordedSet[]) => sets.every((s) => s.kg === kg && s.reps < low);
  if (sessions.length >= 2 && missed(sessions[0]!) && missed(sessions[1]!)) {
    return {
      exerciseId: exercise.id,
      kg: Math.max(exercise.incrementKg, roundToStep(kg * 0.9, exercise.incrementKg)),
      reps: low,
      reason: 'deload',
    };
  }
  return {
    exerciseId: exercise.id,
    kg,
    reps: Math.min(high, Math.max(low, maxReps + 1)),
    reason: 'repeat',
  };
}

/** With auto-overload off: do what you did last time (same weight, best rep count), or start fresh. */
export function repeatLastSession(
  exercise: Exercise,
  sessions: readonly (readonly RecordedSet[])[],
): OverloadSuggestion {
  const last = sessions[0];
  if (!last || last.length === 0) {
    return {
      exerciseId: exercise.id,
      kg: exercise.startKg,
      reps: exercise.repRange[0],
      reason: 'start',
    };
  }
  const kg = Math.max(...last.map((s) => s.kg));
  const reps = Math.max(...last.filter((s) => s.kg === kg).map((s) => s.reps));
  return { exerciseId: exercise.id, kg, reps, reason: 'repeat' };
}

/** The plan after the one most recently completed, so training rotates through the plans. */
export function nextPlan(
  records: readonly WorkoutRecord[],
  plans: readonly WorkoutPlan[],
): WorkoutPlan {
  const lastPlanId = [...records]
    .sort((a, b) => b.endedAt - a.endedAt)
    .find((r) => r.planId)?.planId;
  const index = plans.findIndex((p) => p.id === lastPlanId);
  return plans[(index + 1) % plans.length]!;
}

/**
 * Builds a ready-to-run session: loads and rep targets come from the overload rule, the first set is
 * active, and each exercise carries last session's performance and the athlete's personal best.
 */
export function buildSessionFromPlan(
  plan: WorkoutPlan,
  catalog: readonly Exercise[],
  records: readonly WorkoutRecord[],
  now: number,
  options: { autoOverload?: boolean } = {},
): ActiveSessionTemplate {
  const { autoOverload = true } = options;
  const bests = personalBests(records);
  const exercises: SessionExercise[] = plan.exercises.map((slot, exerciseIndex) => {
    const info = catalog.find((c) => c.id === slot.exerciseId)!;
    const sessions = exerciseSessions(records, info.id);
    const target = autoOverload
      ? suggestOverload(info, sessions)
      : repeatLastSession(info, sessions);
    const lastSets = sessions[0];
    const sets: WorkoutSet[] = Array.from({ length: slot.sets }, (_, i) => ({
      number: i + 1,
      kg: target.kg,
      reps: target.reps,
      status: exerciseIndex === 0 && i === 0 ? 'active' : 'upcoming',
      isPersonalRecord: false,
    }));
    return {
      id: info.id,
      name: info.name,
      category: info.category,
      muscles: info.muscles,
      equipment: equipmentLabel(info.equipment),
      lastWeek: lastSets
        ? { kg: Math.max(...lastSets.map((s) => s.kg)), reps: lastSets.map((s) => s.reps) }
        : null,
      personalBestKg: bests.get(info.id)?.kg ?? 0,
      sets,
    };
  });

  return {
    id: `session-${now}`,
    planId: plan.id,
    title: plan.name,
    startedAt: now,
    priorVolumeKg: 0,
    priorSetsCompleted: 0,
    completedExerciseCount: 0,
    totalExerciseCount: exercises.length,
    heartRateBpm: null,
    exercises,
    currentExerciseIndex: 0,
    rest: null,
  };
}

const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbells',
  machine: 'Machine',
  cable: 'Cable Station',
  bodyweight: 'Bodyweight / Dip Station',
};
export const equipmentLabel = (e: Equipment): string => EQUIPMENT_LABEL[e];

export interface ExerciseFilter {
  query?: string;
  muscleGroup?: MuscleGroup;
  equipment?: Equipment;
}

export function filterExercises(list: readonly Exercise[], filter: ExerciseFilter): Exercise[] {
  const q = filter.query?.trim().toLowerCase();
  return list.filter(
    (e) =>
      (!filter.muscleGroup || e.muscleGroup === filter.muscleGroup) &&
      (!filter.equipment || e.equipment === filter.equipment) &&
      (!q || e.name.toLowerCase().includes(q) || e.muscles.toLowerCase().includes(q)),
  );
}

/** Total tonnage per exercise across all records. */
export function volumeByMuscle(records: readonly WorkoutRecord[]): Record<MuscleGroup, number> {
  const totals: Record<MuscleGroup, number> = {
    chest: 0,
    back: 0,
    legs: 0,
    shoulders: 0,
    arms: 0,
    core: 0,
  };
  for (const r of records) {
    for (const e of r.exercises) {
      totals[e.muscleGroup] += e.sets.reduce((s, x) => s + x.kg * x.reps, 0);
    }
  }
  return totals;
}
