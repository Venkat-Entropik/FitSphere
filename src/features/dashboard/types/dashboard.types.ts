export type DayStatus = 'completed' | 'today' | 'rest' | 'upcoming';

export interface WeeklyFrequencyDay {
  /** Single-letter weekday label. */
  label: string;
  status: DayStatus;
  /** Workout minutes (0 when none). */
  minutes: number;
}

export interface DailyTelemetry {
  steps: number;
  stepsGoal: number;
  activeBurnKcal: number;
  activeBurnGoalKcal: number;
  activeMinutes: number;
  activeMinutesGoal: number;
}

export interface ScheduledWorkout {
  id: string;
  name: string;
  focus: string;
  durationMinutes: number;
  compoundSets: number;
  estimatedKcal: number;
  rpe: number;
  exercises: string[];
}

export interface RecoverySnapshot {
  /** 0–100 */
  score: number;
  label: string;
  hrvMs: number;
  sleepMinutes: number;
}

export interface RecentLog {
  id: string;
  title: string;
  subtitle: string;
  kcal: number;
  /** Right-aligned lime caption, e.g. "9,420 kg" or "4'56\"/km". */
  caption: string;
}

export interface AiInsight {
  completedWorkouts: number;
  targetWorkouts: number;
  recoveryScore: number;
  /** Plain-language suggestion. Not medical advice. */
  suggestion: string;
  syncedMinutesAgo: number;
}

export interface DashboardSummary {
  athleteName: string;
  goalLabel: string;
  streakDays: number;
  weightKg: number;
  weeklyTargetDays: number;
  weekNumber: number;
  programWeeks: number;
  telemetry: DailyTelemetry;
  todaysWorkout: ScheduledWorkout;
  insight: AiInsight;
  weeklyFrequency: WeeklyFrequencyDay[];
  recovery: RecoverySnapshot;
  recentLogs: RecentLog[];
}
