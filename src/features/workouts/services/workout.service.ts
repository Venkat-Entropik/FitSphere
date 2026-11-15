import { dbReady, useMockDb } from '@/services/mock-db/mock-db';
import { commitChange } from '@/services/sync';

import type { ActiveSessionTemplate, WorkoutCategory } from '../types/workout.types';
import type { Exercise, Routine, WorkoutPlan, WorkoutRecord } from '../types/workout-record.types';
import { EXERCISE_CATALOG, WORKOUT_PLANS } from './catalog.mock';
import { buildMockSession, mockWorkoutCategories } from './workout.mock';

export interface WorkoutRepository {
  getCategories(): Promise<WorkoutCategory[]>;
  /** A sample mid-session template (demo only). */
  getActiveSession(): Promise<ActiveSessionTemplate>;
  /** Built-in exercises plus the ones the user created. */
  getExercises(): Promise<Exercise[]>;
  /** Built-in plans plus the user's routines (which sit under the "Custom" category). */
  getPlans(): Promise<WorkoutPlan[]>;
  getRoutines(): Promise<Routine[]>;
  saveRoutine(routine: Routine): Promise<Routine>;
  deleteRoutine(id: string): Promise<void>;
  saveCustomExercise(exercise: Exercise): Promise<Exercise>;
  deleteCustomExercise(id: string): Promise<void>;
  getHistory(): Promise<WorkoutRecord[]>;
  saveWorkout(record: WorkoutRecord): Promise<WorkoutRecord>;
}

/** The plan shape the rest of the app already understands. */
export const routineToPlan = (r: Routine): WorkoutPlan => ({
  id: r.id,
  name: r.name,
  categoryId: 'custom',
  focus: 'Your routine',
  exercises: r.exercises,
});

/** Ids the app generates for things the user creates. They can never clash with built-in ids. */
export const newCustomId = (prefix: 'routine' | 'custom') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const routinesNow = () => useMockDb.getState().routines ?? [];
const customExercisesNow = () => useMockDb.getState().customExercises ?? [];

/**
 * Exercises, plans and categories are bundled reference data, extended by what the user creates.
 * History, routines and custom exercises live in the on-device database; with the real backend each
 * save also queues for the server, so everything here works offline.
 */
export const workoutService: WorkoutRepository = {
  getCategories: async () => mockWorkoutCategories,
  getActiveSession: async () => buildMockSession(),
  getExercises: async () => {
    await dbReady();
    return [...EXERCISE_CATALOG, ...customExercisesNow()];
  },
  getPlans: async () => {
    await dbReady();
    return [...WORKOUT_PLANS, ...routinesNow().map(routineToPlan)];
  },
  getRoutines: async () => {
    await dbReady();
    return [...routinesNow()].sort((a, b) => b.updatedAt - a.updatedAt);
  },
  saveRoutine: async (routine) => {
    await commitChange({ type: 'routine.save', routine });
    return routine;
  },
  deleteRoutine: async (id) => {
    await commitChange({ type: 'routine.delete', routineId: id });
  },
  saveCustomExercise: async (exercise) => {
    await commitChange({ type: 'exercise.save', exercise });
    return exercise;
  },
  deleteCustomExercise: async (id) => {
    await commitChange({ type: 'exercise.delete', exerciseId: id });
  },
  getHistory: async () => {
    await dbReady();
    return useMockDb.getState().workouts;
  },
  saveWorkout: async (record) => {
    await commitChange({ type: 'workout.save', record });
    return record;
  },
};
