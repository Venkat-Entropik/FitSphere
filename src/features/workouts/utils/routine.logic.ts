import type {
  Equipment,
  Exercise,
  MuscleGroup,
  PlanExerciseSlot,
  Routine,
} from '../types/workout-record.types';

export const MAX_SLOTS = 30;
export const MAX_SETS = 10;
export const DEFAULT_SETS = 3;
export const MAX_ROUTINES = 50;
export const NAME_MAX = 60;

export const MUSCLE_GROUPS: readonly { id: MuscleGroup; label: string }[] = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'legs', label: 'Legs' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'core', label: 'Core' },
];

export const EQUIPMENT: readonly { id: Equipment; label: string }[] = [
  { id: 'barbell', label: 'Barbell' },
  { id: 'dumbbell', label: 'Dumbbell' },
  { id: 'machine', label: 'Machine' },
  { id: 'cable', label: 'Cable' },
  { id: 'bodyweight', label: 'Bodyweight' },
];

export const isCustomExercise = (id: string) => id.startsWith('custom-');

/** Smallest sensible weight jump when the user doesn't know: it only seeds the progression rule. */
const INCREMENT_BY_EQUIPMENT: Record<Equipment, number> = {
  barbell: 2.5,
  dumbbell: 2,
  machine: 5,
  cable: 5,
  bodyweight: 1,
};

export interface RoutineDraft {
  name: string;
  slots: PlanExerciseSlot[];
}

export type RoutineErrors = Partial<Record<'name' | 'slots', string>>;

export function validateRoutine(draft: RoutineDraft): RoutineErrors {
  const errors: RoutineErrors = {};
  const name = draft.name.trim();
  if (name.length === 0) errors.name = 'Give your routine a name';
  else if (name.length > NAME_MAX) errors.name = `Keep the name under ${NAME_MAX} characters`;
  if (draft.slots.length === 0) errors.slots = 'Add at least one exercise';
  return errors;
}

/** Adds exercises to the end, skipping ones already in the routine and capping the total. */
export function addExercises(
  slots: readonly PlanExerciseSlot[],
  ids: readonly string[],
): PlanExerciseSlot[] {
  const next = [...slots];
  for (const exerciseId of ids) {
    if (next.length >= MAX_SLOTS) break;
    if (next.some((s) => s.exerciseId === exerciseId)) continue;
    next.push({ exerciseId, sets: DEFAULT_SETS });
  }
  return next;
}

export function removeSlot(slots: readonly PlanExerciseSlot[], index: number): PlanExerciseSlot[] {
  return slots.filter((_, i) => i !== index);
}

/** Moves one exercise up (-1) or down (+1); out-of-range moves change nothing. */
export function moveSlot(
  slots: readonly PlanExerciseSlot[],
  index: number,
  direction: -1 | 1,
): PlanExerciseSlot[] {
  const target = index + direction;
  if (target < 0 || target >= slots.length || index < 0 || index >= slots.length) return [...slots];
  const next = [...slots];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

export function changeSets(
  slots: readonly PlanExerciseSlot[],
  index: number,
  delta: 1 | -1,
): PlanExerciseSlot[] {
  return slots.map((s, i) =>
    i === index ? { ...s, sets: Math.min(MAX_SETS, Math.max(1, s.sets + delta)) } : s,
  );
}

/** Builds the record to store. Editing keeps the original id and creation time. */
export function buildRoutine(
  draft: RoutineDraft,
  options: { id: string; now: number; existing?: Routine },
): Routine {
  return {
    id: options.id,
    name: draft.name.trim(),
    exercises: draft.slots.map((s) => ({ exerciseId: s.exerciseId, sets: s.sets })),
    createdAt: options.existing?.createdAt ?? options.now,
    updatedAt: options.now,
  };
}

export interface CustomExerciseInput {
  name: string;
  muscleGroup: MuscleGroup | null;
  equipment: Equipment | null;
  minReps: string;
  maxReps: string;
  startKg: string;
}

export type CustomExerciseErrors = Partial<
  Record<'name' | 'muscleGroup' | 'equipment' | 'reps' | 'startKg', string>
>;

const wholeNumber = (raw: string): number | null =>
  /^\d{1,3}$/.test(raw.trim()) ? Number(raw.trim()) : null;
const decimal = (raw: string): number | null => {
  const t = raw.trim().replace(',', '.');
  return /^\d{1,3}(\.\d{1,2})?$/.test(t) ? Number(t) : null;
};

/** Checks the form; on success returns the exercise to save (the caller supplies a fresh id). */
export function validateCustomExercise(
  input: CustomExerciseInput,
  id: string,
  existingNames: readonly string[] = [],
): { ok: true; exercise: Exercise } | { ok: false; errors: CustomExerciseErrors } {
  const errors: CustomExerciseErrors = {};
  const name = input.name.trim();
  if (name.length === 0) errors.name = 'Name your exercise';
  else if (name.length > NAME_MAX) errors.name = `Keep the name under ${NAME_MAX} characters`;
  else if (existingNames.some((n) => n.toLowerCase() === name.toLowerCase())) {
    errors.name = 'An exercise with this name already exists';
  }
  if (!input.muscleGroup) errors.muscleGroup = 'Pick the main muscle group';
  if (!input.equipment) errors.equipment = 'Pick the equipment';
  const low = wholeNumber(input.minReps);
  const high = wholeNumber(input.maxReps);
  if (low === null || high === null || low < 1 || high > 100)
    errors.reps = 'Enter whole numbers from 1 to 100';
  else if (low > high) errors.reps = 'Minimum reps cannot be higher than maximum';
  const startKg = decimal(input.startKg);
  if (startKg === null || startKg > 500) errors.startKg = 'Enter a weight from 0 to 500 kg';

  if (
    Object.keys(errors).length > 0 ||
    !input.muscleGroup ||
    !input.equipment ||
    low === null ||
    high === null ||
    startKg === null
  ) {
    return { ok: false, errors };
  }
  const group = MUSCLE_GROUPS.find((g) => g.id === input.muscleGroup)!.label;
  return {
    ok: true,
    exercise: {
      id,
      name,
      muscleGroup: input.muscleGroup,
      muscles: group,
      equipment: input.equipment,
      category: `${group} · Custom`,
      repRange: [low, high],
      incrementKg: INCREMENT_BY_EQUIPMENT[input.equipment],
      startKg,
    },
  };
}

/** Routines that still use an exercise, so it isn't deleted out from under them. */
export const routinesUsing = (routines: readonly Routine[], exerciseId: string): Routine[] =>
  routines.filter((r) => r.exercises.some((s) => s.exerciseId === exerciseId));
