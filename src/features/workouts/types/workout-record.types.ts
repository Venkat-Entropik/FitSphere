export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';
export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  /** Secondary description shown under the name. */
  muscles: string;
  equipment: Equipment;
  /** e.g. "Chest Compound" */
  category: string;
  /** Rep range the progressive-overload rule targets. */
  repRange: readonly [number, number];
  /** Smallest sensible weight jump for this lift (kg). */
  incrementKg: number;
  /** Starting weight when there is no history (kg). */
  startKg: number;
  /** "How to" demonstration. Absent for exercises without a curated video. */
  video?: ExerciseVideo;
  /** Short form cues shown beside the video. */
  cues?: readonly string[];
}

export interface ExerciseVideo {
  /** YouTube video id (the `v=` value). */
  youtubeId: string;
  /** Video title, shown as the player's accessibility label. */
  title: string;
}

export interface PlanExerciseSlot {
  exerciseId: string;
  sets: number;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  /** Matches a workout category chip id. */
  categoryId: string;
  focus: string;
  exercises: PlanExerciseSlot[];
}

export interface RecordedSet {
  kg: number;
  reps: number;
  isPersonalRecord: boolean;
}

export interface RecordedExercise {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: RecordedSet[];
}

/** A finished workout, as stored by the backend. */
export interface WorkoutRecord {
  id: string;
  planId: string | null;
  title: string;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  volumeKg: number;
  setsCompleted: number;
  prCount: number;
  kcal: number;
  exercises: RecordedExercise[];
  /** Records created by the seeding routine rather than by the user. */
  source: 'user' | 'sample';
}

export interface OverloadSuggestion {
  exerciseId: string;
  kg: number;
  reps: number;
  reason: 'progress' | 'repeat' | 'deload' | 'start';
}
