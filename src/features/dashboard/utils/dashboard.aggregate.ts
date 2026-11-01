import type { ActivityRecord } from '@/features/activities/types/activity.types';
import { formatPace } from '@/features/activities/utils/activity.logic';
import { goalById } from '@/features/authentication/utils/onboarding.logic';
import type { UserProfile } from '@/features/profile/types/profile.types';
import type { WorkoutPlan, WorkoutRecord } from '@/features/workouts/types/workout-record.types';
import { EXERCISE_CATALOG } from '@/features/workouts/services/catalog.mock';
import { estimateWorkoutKcal, nextPlan } from '@/features/workouts/utils/workout-history.logic';
import { addDays, dateKey, daysBetween, startOfDay, startOfWeek } from '@/utils/date';
import { currentStreak } from '@/utils/streak';

import type {
  DashboardSummary,
  DayStatus,
  RecentLog,
  RecoverySnapshot,
  WeeklyFrequencyDay,
} from '../types/dashboard.types';

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const PROGRAM_WEEKS = 6;
const TELEMETRY_GOALS = { burnKcal: 600, activeMinutes: 60, steps: 10_000 };

/** The app has no pedometer or wearable yet, so steps/HRV/sleep are labelled sample values. */
const SAMPLE_SENSORS = { steps: 8420, hrvMs: 68, sleepMinutes: 465 };

export interface DashboardInput {
  now: number;
  profile: UserProfile;
  workouts: readonly WorkoutRecord[];
  activities: readonly ActivityRecord[];
  plans: readonly WorkoutPlan[];
}

interface DayLog {
  minutes: number;
  kcal: number;
}

/** Minutes and calories logged per local day, across workouts and activities. */
export function dailyLogs(
  workouts: readonly WorkoutRecord[],
  activities: readonly ActivityRecord[],
): Map<string, DayLog> {
  const map = new Map<string, DayLog>();
  const add = (at: number, sec: number, kcal: number) => {
    const key = dateKey(at);
    const cur = map.get(key) ?? { minutes: 0, kcal: 0 };
    map.set(key, { minutes: cur.minutes + Math.round(sec / 60), kcal: cur.kcal + kcal });
  };
  workouts.forEach((w) => add(w.startedAt, w.durationSec, w.kcal));
  activities.forEach((a) => add(a.startedAt, a.durationSec, a.kcal));
  return map;
}

export function weekDays(now: number, logs: ReadonlyMap<string, DayLog>): WeeklyFrequencyDay[] {
  const monday = startOfWeek(now);
  const todayKey = dateKey(now);
  return WEEKDAY_LETTERS.map((label, i) => {
    const day = addDays(monday, i);
    const key = dateKey(day);
    const minutes = logs.get(key)?.minutes ?? 0;
    const status: DayStatus =
      key === todayKey
        ? minutes > 0
          ? 'completed'
          : 'today'
        : key > todayKey
          ? 'upcoming'
          : minutes > 0
            ? 'completed'
            : 'rest';
    return { label, status, minutes };
  });
}

/**
 * Recovery estimate from recent training load: starts high and drops with sessions in the last 48 h
 * (more for heavy ones). A planning heuristic — not a measurement or medical advice.
 */
export function recoveryScore(
  workouts: readonly WorkoutRecord[],
  activities: readonly ActivityRecord[],
  now: number,
): number {
  const since = now - 48 * 3_600_000;
  const recent = [
    ...workouts.filter((w) => w.endedAt >= since),
    ...activities.filter((a) => a.endedAt >= since),
  ];
  const load = recent.reduce((sum, r) => {
    const ageHours = (now - r.endedAt) / 3_600_000;
    const weight = 1 - ageHours / 48; // fresher sessions weigh more
    const intensity = 'volumeKg' in r ? 12 + Math.min(10, r.volumeKg / 2000) : 8;
    return sum + intensity * weight;
  }, 0);
  return Math.max(55, Math.min(98, Math.round(98 - load)));
}

const recoveryLabel = (score: number) =>
  score >= 85 ? 'Optimal State' : score >= 70 ? 'Good State' : 'Take It Easy';

export function recoverySnapshot(score: number): RecoverySnapshot {
  return {
    score,
    label: recoveryLabel(score),
    hrvMs: SAMPLE_SENSORS.hrvMs,
    sleepMinutes: SAMPLE_SENSORS.sleepMinutes,
  };
}

export function relativeDay(at: number, now: number): string {
  const diff = daysBetween(at, now);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return WEEKDAY_NAMES[new Date(at).getDay()]!;
}

export function recentLogs(
  workouts: readonly WorkoutRecord[],
  activities: readonly ActivityRecord[],
  now: number,
  limit = 3,
): RecentLog[] {
  const logs = [
    ...workouts.map((w) => ({
      at: w.endedAt,
      log: {
        id: w.id,
        title: w.title.split(' –')[0]!,
        subtitle: `${relativeDay(w.endedAt, now)} • ${w.setsCompleted} sets${w.prCount ? ` • ${w.prCount} PR` : ''}`,
        kcal: w.kcal,
        caption: `${Math.round(w.volumeKg).toLocaleString('en-US')} kg`,
      } satisfies RecentLog,
    })),
    ...activities.map((a) => ({
      at: a.endedAt,
      log: {
        id: a.id,
        title: a.title,
        subtitle: `${relativeDay(a.endedAt, now)} • ${a.distanceKm.toFixed(1)} km`,
        kcal: a.kcal,
        caption: a.avgPaceSecPerKm
          ? `${formatPace(a.avgPaceSecPerKm)}/km`
          : `${Math.round(a.durationSec / 60)} min`,
      } satisfies RecentLog,
    })),
  ];
  return logs
    .sort((a, b) => b.at - a.at)
    .slice(0, limit)
    .map((l) => l.log);
}

export function buildDashboard(input: DashboardInput): DashboardSummary {
  const { now, profile, workouts, activities, plans } = input;
  const p = profile.profile;
  const logs = dailyLogs(workouts, activities);
  const today = logs.get(dateKey(now)) ?? { minutes: 0, kcal: 0 };
  const days = weekDays(now, logs);
  const weekStart = startOfWeek(now).getTime();
  const weekWorkouts = workouts.filter((w) => w.startedAt >= weekStart).length;
  const plan = nextPlan(workouts, plans);
  const score = recoveryScore(workouts, activities, now);
  const firstTrained = Math.min(now, ...workouts.map((w) => w.startedAt));
  const weeksIn = Math.floor(daysBetween(firstTrained, startOfDay(now)) / 7);

  const sets = plan.exercises.reduce((n, e) => n + e.sets, 0);
  const goal = goalById(p.goal);
  const suggestion =
    score >= 85
      ? `Today, consider a focused ${plan.focus.toLowerCase()} session with progressive overload.`
      : 'Recovery is lower than usual — consider an easier session or a rest day today.';

  return {
    athleteName: profile.identity.name.split(' ')[0]!,
    goalLabel: goal.title,
    streakDays: currentStreak(
      [...workouts, ...activities].map((r) => dateKey(r.startedAt)),
      now,
    ),
    weightKg: p.weightKg,
    weeklyTargetDays: p.daysPerWeek,
    weekNumber: (weeksIn % PROGRAM_WEEKS) + 1,
    programWeeks: PROGRAM_WEEKS,
    telemetry: {
      steps: SAMPLE_SENSORS.steps,
      stepsGoal: TELEMETRY_GOALS.steps,
      activeBurnKcal: today.kcal,
      activeBurnGoalKcal: TELEMETRY_GOALS.burnKcal,
      activeMinutes: today.minutes,
      activeMinutesGoal: TELEMETRY_GOALS.activeMinutes,
    },
    todaysWorkout: {
      id: plan.id,
      name: plan.name.split(' –')[0]!,
      focus: plan.focus,
      durationMinutes: 55,
      compoundSets: sets,
      estimatedKcal: estimateWorkoutKcal(55 * 60, p.weightKg),
      rpe: 8.5,
      exercises: plan.exercises.map(
        (e) => EXERCISE_CATALOG.find((c) => c.id === e.exerciseId)?.name ?? e.exerciseId,
      ),
    },
    insight: {
      completedWorkouts: weekWorkouts,
      targetWorkouts: p.daysPerWeek,
      recoveryScore: score,
      suggestion,
      syncedMinutesAgo: 0,
    },
    weeklyFrequency: days,
    recovery: recoverySnapshot(score),
    recentLogs: recentLogs(workouts, activities, now),
  };
}
