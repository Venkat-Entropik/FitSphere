import type { ActiveSessionTemplate, WorkoutCategory } from '../types/workout.types';

export const mockWorkoutCategories: WorkoutCategory[] = [
  { id: 'push', label: 'Push Day' },
  { id: 'pull', label: 'Pull Day' },
  { id: 'legs', label: 'Leg Day' },
  { id: 'upper', label: 'Upper Body' },
  { id: 'custom', label: 'Custom', icon: 'tune' },
];

/** Sample session mirroring the Stitch reference: set 3 of exercise 3 is in progress. */
export function buildMockSession(now = Date.now()): ActiveSessionTemplate {
  return {
    id: 'push-day-chest-triceps',
    title: 'Push Day – Chest & Triceps Focus',
    startedAt: now - (42 * 60 + 15) * 1000,
    priorVolumeKg: 5800,
    priorSetsCompleted: 9,
    completedExerciseCount: 2,
    totalExerciseCount: 5,
    heartRateBpm: 138,
    currentExerciseIndex: 0,
    rest: { totalSeconds: 105, remainingSeconds: 78 },
    exercises: [
      {
        id: 'incline-db-press',
        name: 'Incline Dumbbell Bench Press',
        category: 'Chest Compound',
        muscles: 'Upper Pectorals · Anterior Deltoid · Triceps',
        equipment: 'Adjustable Bench (30°)',
        lastWeek: { kg: 30, reps: [10, 10, 8] },
        personalBestKg: 30,
        sets: [
          { number: 1, kg: 30, reps: 10, status: 'done', isPersonalRecord: false },
          { number: 2, kg: 32, reps: 10, status: 'done', isPersonalRecord: true },
          { number: 3, kg: 32, reps: 8, status: 'active', isPersonalRecord: false },
          { number: 4, kg: 32, reps: 8, status: 'upcoming', isPersonalRecord: false },
        ],
      },
      {
        id: 'weighted-tricep-dips',
        name: 'Weighted Tricep Dips',
        category: 'Triceps Compound',
        muscles: 'Triceps · Lower Pectorals · Anterior Deltoid',
        equipment: 'Dip Station',
        lastWeek: { kg: 15, reps: [10, 8, 8] },
        personalBestKg: 15,
        sets: [
          { number: 1, kg: 15, reps: 10, status: 'upcoming', isPersonalRecord: false },
          { number: 2, kg: 15, reps: 8, status: 'upcoming', isPersonalRecord: false },
          { number: 3, kg: 15, reps: 8, status: 'upcoming', isPersonalRecord: false },
        ],
      },
    ],
  };
}
