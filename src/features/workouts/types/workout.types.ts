export type SetStatus = 'done' | 'active' | 'upcoming';

export interface WorkoutSet {
  /** 1-based set number. */
  number: number;
  kg: number;
  reps: number;
  status: SetStatus;
  isPersonalRecord: boolean;
}

export interface LastPerformance {
  kg: number;
  reps: number[];
}

export interface SessionExercise {
  id: string;
  name: string;
  /** e.g. "Chest Compound" */
  category: string;
  muscles: string;
  equipment: string;
  lastWeek: LastPerformance | null;
  /** Heaviest completed weight so far; a heavier logged set is a new PR. */
  personalBestKg: number;
  sets: WorkoutSet[];
}

/** Server/template shape for a session that is about to start or resume. */
export interface ActiveSessionTemplate {
  id: string;
  title: string;
  /** Epoch ms the session began. */
  startedAt: number;
  /** Work completed in exercises before the ones listed below. */
  priorVolumeKg: number;
  priorSetsCompleted: number;
  /** Exercises finished before the ones listed below, and the planned total for the session. */
  completedExerciseCount: number;
  totalExerciseCount: number;
  /** null when no heart-rate sensor is connected. */
  heartRateBpm: number | null;
  exercises: SessionExercise[];
  /** Index of the exercise being performed. */
  currentExerciseIndex: number;
  rest: { totalSeconds: number; remainingSeconds: number } | null;
}

export interface ActiveSession {
  id: string;
  title: string;
  startedAt: number;
  priorVolumeKg: number;
  priorSetsCompleted: number;
  completedExerciseCount: number;
  totalExerciseCount: number;
  heartRateBpm: number | null;
  exercises: SessionExercise[];
  currentExerciseIndex: number;
}

export interface RestTimer {
  /** Epoch ms the rest ends. */
  endsAt: number;
  totalSeconds: number;
}

export interface WorkoutCategory {
  id: string;
  label: string;
  icon?: string;
}
