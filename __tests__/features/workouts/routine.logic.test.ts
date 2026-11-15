import type { Routine } from '@/features/workouts/types/workout-record.types';
import {
  addExercises,
  buildRoutine,
  changeSets,
  DEFAULT_SETS,
  MAX_SETS,
  MAX_SLOTS,
  moveSlot,
  removeSlot,
  routinesUsing,
  validateCustomExercise,
  validateRoutine,
} from '@/features/workouts/utils/routine.logic';

const slot = (exerciseId: string, sets = 3) => ({ exerciseId, sets });

describe('routine drafts', () => {
  it('needs a name and at least one exercise', () => {
    expect(validateRoutine({ name: '  ', slots: [] })).toEqual({
      name: 'Give your routine a name',
      slots: 'Add at least one exercise',
    });
    expect(validateRoutine({ name: 'x'.repeat(61), slots: [slot('a')] }).name).toMatch(/under 60/);
    expect(validateRoutine({ name: 'Push', slots: [slot('a')] })).toEqual({});
  });

  it('adds exercises once each, at the end, with default sets', () => {
    const out = addExercises([slot('a', 5)], ['b', 'a', 'c', 'b']);
    expect(out).toEqual([slot('a', 5), slot('b', DEFAULT_SETS), slot('c', DEFAULT_SETS)]);
  });

  it('never exceeds the maximum number of exercises', () => {
    const ids = Array.from({ length: 40 }, (_, i) => `e${i}`);
    expect(addExercises([], ids)).toHaveLength(MAX_SLOTS);
  });

  it('removes and reorders without mutating the original', () => {
    const slots = [slot('a'), slot('b'), slot('c')];
    expect(removeSlot(slots, 1).map((s) => s.exerciseId)).toEqual(['a', 'c']);
    expect(moveSlot(slots, 2, -1).map((s) => s.exerciseId)).toEqual(['a', 'c', 'b']);
    expect(moveSlot(slots, 0, 1).map((s) => s.exerciseId)).toEqual(['b', 'a', 'c']);
    expect(moveSlot(slots, 0, -1)).toEqual(slots);
    expect(moveSlot(slots, 2, 1)).toEqual(slots);
    expect(slots.map((s) => s.exerciseId)).toEqual(['a', 'b', 'c']);
  });

  it('keeps sets between 1 and the maximum', () => {
    expect(changeSets([slot('a', 1)], 0, -1)[0]!.sets).toBe(1);
    expect(changeSets([slot('a', MAX_SETS)], 0, 1)[0]!.sets).toBe(MAX_SETS);
    expect(changeSets([slot('a', 3)], 0, 1)[0]!.sets).toBe(4);
  });

  it('builds a record, keeping the original id and creation time when editing', () => {
    const existing: Routine = {
      id: 'r1',
      name: 'Old',
      exercises: [],
      createdAt: 100,
      updatedAt: 100,
    };
    const edited = buildRoutine(
      { name: '  Push A ', slots: [slot('a', 4)] },
      { id: 'r1', now: 500, existing },
    );
    expect(edited).toEqual({
      id: 'r1',
      name: 'Push A',
      exercises: [slot('a', 4)],
      createdAt: 100,
      updatedAt: 500,
    });
    const fresh = buildRoutine({ name: 'New', slots: [slot('a')] }, { id: 'r2', now: 900 });
    expect([fresh.createdAt, fresh.updatedAt]).toEqual([900, 900]);
  });

  it('finds the routines that use an exercise', () => {
    const routines: Routine[] = [
      { id: 'r1', name: 'A', exercises: [slot('x')], createdAt: 1, updatedAt: 1 },
      { id: 'r2', name: 'B', exercises: [slot('y')], createdAt: 1, updatedAt: 1 },
    ];
    expect(routinesUsing(routines, 'x').map((r) => r.id)).toEqual(['r1']);
    expect(routinesUsing(routines, 'z')).toEqual([]);
  });
});

describe('custom exercise form', () => {
  const good = {
    name: ' Landmine Press ',
    muscleGroup: 'shoulders',
    equipment: 'barbell',
    minReps: '8',
    maxReps: '12',
    startKg: '20',
  } as const;

  it('builds an exercise with a sensible weight jump for the equipment', () => {
    const result = validateCustomExercise(good, 'custom-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.exercise).toMatchObject({
        id: 'custom-1',
        name: 'Landmine Press',
        muscleGroup: 'shoulders',
        equipment: 'barbell',
        repRange: [8, 12],
        incrementKg: 2.5,
        startKg: 20,
      });
    }
    const dumbbell = validateCustomExercise(
      { ...good, equipment: 'dumbbell', startKg: '12,5' },
      'custom-2',
    );
    expect(dumbbell.ok && dumbbell.exercise.incrementKg).toBe(2);
    expect(dumbbell.ok && dumbbell.exercise.startKg).toBe(12.5);
  });

  it('explains every problem at once', () => {
    const result = validateCustomExercise(
      { name: '', muscleGroup: null, equipment: null, minReps: '12', maxReps: '8', startKg: 'abc' },
      'custom-1',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual([
        'equipment',
        'muscleGroup',
        'name',
        'reps',
        'startKg',
      ]);
    }
  });

  it('rejects out-of-range numbers and duplicate names', () => {
    expect(validateCustomExercise({ ...good, minReps: '0' }, 'c').ok).toBe(false);
    expect(validateCustomExercise({ ...good, maxReps: '101' }, 'c').ok).toBe(false);
    expect(validateCustomExercise({ ...good, startKg: '501' }, 'c').ok).toBe(false);
    const dup = validateCustomExercise(good, 'c', ['landmine press']);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.errors.name).toMatch(/already exists/);
    expect(validateCustomExercise({ ...good, startKg: '0' }, 'c').ok).toBe(true);
  });
});
