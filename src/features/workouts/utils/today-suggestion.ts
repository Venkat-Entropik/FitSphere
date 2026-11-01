import type { Exercise, WorkoutPlan, WorkoutRecord } from '../types/workout-record.types';
import {
  exerciseSessions,
  nextPlan,
  repeatLastSession,
  suggestOverload,
} from './workout-history.logic';

const DAY_MS = 86_400_000;

export interface SuggestedExercise {
  exercise: Exercise;
  sets: number;
  kg: number;
  reps: number;
  /** One short phrase about the target, e.g. "Add weight". */
  note: string;
}

export interface TodaySuggestion {
  plan: WorkoutPlan;
  /** Why this day, in plain language. */
  reason: string;
  items: SuggestedExercise[];
}

const NOTE = {
  start: 'Starting load',
  progress: 'Add weight',
  repeat: 'Beat last reps',
  deload: 'Lighter this time',
} as const;

function reasonFor(
  plan: WorkoutPlan,
  recommended: WorkoutPlan,
  records: readonly WorkoutRecord[],
  now: number,
) {
  if (plan.id !== recommended.id) return 'Your pick. Loads are set from your recent sessions.';
  const last = [...records].sort((a, b) => b.endedAt - a.endedAt)[0];
  if (!last)
    return 'A good place to start. Begin with the suggested loads and keep a rep or two in reserve.';
  const days = Math.floor((now - last.endedAt) / DAY_MS);
  const lastName = last.title.split(' –')[0];
  if (days <= 0)
    return `You already trained today (${lastName}). This is next in your rotation if you want a second session; rest is fine too.`;
  if (days >= 3)
    return `It has been ${days} days since ${lastName}. Next in your rotation. Ease back in.`;
  return `Next in your rotation after ${lastName} ${days === 1 ? 'yesterday' : `${days} days ago`}.`;
}

/** Today's gym suggestion: the plan, why, and a target load for every exercise (same rule the session uses). */
export function buildTodaySuggestion(input: {
  plan: WorkoutPlan;
  plans: readonly WorkoutPlan[];
  catalog: readonly Exercise[];
  records: readonly WorkoutRecord[];
  now: number;
  autoOverload: boolean;
}): TodaySuggestion {
  const { plan, plans, catalog, records, now, autoOverload } = input;
  const items = plan.exercises.flatMap((slot) => {
    const exercise = catalog.find((e) => e.id === slot.exerciseId);
    if (!exercise) return [];
    const sessions = exerciseSessions(records, exercise.id);
    const target = autoOverload
      ? suggestOverload(exercise, sessions)
      : repeatLastSession(exercise, sessions);
    return [
      { exercise, sets: slot.sets, kg: target.kg, reps: target.reps, note: NOTE[target.reason] },
    ];
  });
  return { plan, reason: reasonFor(plan, nextPlan(records, plans), records, now), items };
}
