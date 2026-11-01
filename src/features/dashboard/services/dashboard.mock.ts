import type { DashboardSummary } from '../types/dashboard.types';

/** Sample data mirroring the Stitch reference; replaced by the real API when the backend exists. */
export const mockDashboardSummary: DashboardSummary = {
  athleteName: 'Alex',
  goalLabel: 'Build Muscle',
  streakDays: 14,
  weightKg: 68.5,
  weeklyTargetDays: 5,
  weekNumber: 4,
  programWeeks: 6,
  telemetry: {
    steps: 8420,
    stepsGoal: 10000,
    activeBurnKcal: 420,
    activeBurnGoalKcal: 600,
    activeMinutes: 65,
    activeMinutesGoal: 60,
  },
  todaysWorkout: {
    id: 'hypertrophy-push-ii',
    name: 'Hypertrophy Push II',
    focus: 'Upper Chest & Lateral Triceps',
    durationMinutes: 55,
    compoundSets: 5,
    estimatedKcal: 380,
    rpe: 8.5,
    exercises: ['Incline DB Press', 'Cable Flyes', 'Overhead Extension', 'Lateral Raise', 'Dips'],
  },
  insight: {
    completedWorkouts: 4,
    targetWorkouts: 5,
    recoveryScore: 92,
    suggestion:
      'Today, consider a focused upper-body hypertrophy session with progressive overload.',
    syncedMinutesAgo: 12,
  },
  weeklyFrequency: [
    { label: 'M', status: 'completed', minutes: 65 },
    { label: 'T', status: 'completed', minutes: 50 },
    { label: 'W', status: 'completed', minutes: 75 },
    { label: 'T', status: 'today', minutes: 30 },
    { label: 'F', status: 'completed', minutes: 60 },
    { label: 'S', status: 'rest', minutes: 0 },
    { label: 'S', status: 'rest', minutes: 0 },
  ],
  recovery: { score: 92, label: 'Optimal State', hrvMs: 68, sleepMinutes: 465 },
  recentLogs: [
    {
      id: 'pull-day',
      title: 'Pull Day: Back & Biceps',
      subtitle: 'Yesterday • 6 sets Deadlift',
      kcal: 412,
      volumePercent: 100,
    },
  ],
};
