import type { ActivityRecord } from '@/features/activities/types/activity.types';
import type { Meal } from '@/features/nutrition/types/nutrition.types';
import type {
  OnboardingProfile,
  ProfilePatch,
  WeightEntry,
} from '@/features/profile/types/profile.types';
import type {
  Exercise,
  Routine,
  WorkoutRecord,
} from '@/features/workouts/types/workout-record.types';

/**
 * One change made on this device. Each is applied to the local database immediately and sent to the
 * server later. Every kind is safe to send twice: records carry client-generated ids, and the server
 * ignores a repeat.
 */
export type SyncChange =
  | { type: 'workout.save'; record: WorkoutRecord }
  | { type: 'activity.save'; record: ActivityRecord }
  | { type: 'meal.log'; dateKey: string; meal: Meal }
  | { type: 'meal.remove'; dateKey: string; mealId: string }
  | { type: 'water.add'; dateKey: string; ml: number; goalMl: number; eventId: string }
  | { type: 'weight.log'; entry: WeightEntry; now: number }
  | { type: 'profile.save'; profile: OnboardingProfile; now: number }
  | { type: 'profile.patch'; patch: ProfilePatch; now: number }
  | { type: 'routine.save'; routine: Routine }
  | { type: 'routine.delete'; routineId: string }
  | { type: 'exercise.save'; exercise: Exercise }
  | { type: 'exercise.delete'; exerciseId: string };

export interface QueuedChange {
  /** Queue position and identity. */
  id: string;
  /** The account that made the change; it is only ever sent while that account is signed in. */
  userId: string;
  createdAt: number;
  change: SyncChange;
  /** `failed` means the server refused it permanently; the user decides to retry or discard. */
  status: 'pending' | 'failed';
  attempts: number;
  error?: string;
}
