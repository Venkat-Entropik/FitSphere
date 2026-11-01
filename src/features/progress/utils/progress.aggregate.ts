import { formatPace } from '@/features/activities/utils/activity.logic';
import { activityBests } from '@/features/activities/utils/activity-history.logic';
import type { ActivityRecord } from '@/features/activities/types/activity.types';
import { goalById } from '@/features/authentication/utils/onboarding.logic';
import type { UserProfile, WeightEntry } from '@/features/profile/types/profile.types';
import { weightChange } from '@/features/profile/utils/profile.logic';
import type { WorkoutRecord } from '@/features/workouts/types/workout-record.types';
import { personalBests } from '@/features/workouts/utils/workout-history.logic';
import { addDays, dateKey, daysBetween, startOfWeek } from '@/utils/date';
import { currentStreak, longestStreak } from '@/utils/streak';

import type {
  Badge,
  BodySnapshot,
  HeatCell,
  PersonalRecord,
  ProgressOverview,
} from '../types/progress.types';
import { weeksToTarget } from './progress.logic';

const PROGRAM_WEEKS = 6;
const HEATMAP_DAYS = 14;
const DAY_MS = 86_400_000;

export interface ProgressInput {
  now: number;
  profile: UserProfile;
  workouts: readonly WorkoutRecord[];
  activities: readonly ActivityRecord[];
  weights: readonly WeightEntry[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Last 14 days, oldest first; strength wins over cardio when both happened on a day. */
export function heatmap(
  now: number,
  workouts: readonly WorkoutRecord[],
  activities: readonly ActivityRecord[],
): HeatCell[] {
  const strength = new Set(workouts.map((w) => dateKey(w.startedAt)));
  const cardio = new Set(activities.map((a) => dateKey(a.startedAt)));
  return Array.from({ length: HEATMAP_DAYS }, (_, i) => {
    const key = dateKey(addDays(now, i - (HEATMAP_DAYS - 1)));
    return {
      day: i + 1,
      kind: strength.has(key) ? 'strength' : cardio.has(key) ? 'cardio' : 'rest',
    };
  });
}

/** Heaviest single week of lifting (rolling seven-day windows ending on each workout). */
export function bestWeeklyVolume(workouts: readonly WorkoutRecord[]): number {
  const sorted = [...workouts].sort((a, b) => a.startedAt - b.startedAt);
  let best = 0;
  sorted.forEach((w, i) => {
    const from = w.startedAt - 6 * DAY_MS;
    const total = sorted
      .slice(0, i + 1)
      .filter((x) => x.startedAt >= from)
      .reduce((s, x) => s + x.volumeKg, 0);
    best = Math.max(best, total);
  });
  return Math.round(best);
}

function relativeAge(at: number, now: number): string {
  const days = Math.max(0, daysBetween(at, now));
  return days === 0 ? 'TODAY' : `${days}D AGO`;
}

export function personalRecordCards(
  workouts: readonly WorkoutRecord[],
  activities: readonly ActivityRecord[],
  now: number,
  limit = 4,
): { items: PersonalRecord[]; totalCount: number } {
  const lifts = [...personalBests(workouts).values()].sort((a, b) => b.achievedAt - a.achievedAt);
  const liftCards: (PersonalRecord & { at: number })[] = lifts.map((b) => {
    const fresh = now - b.achievedAt <= 7 * DAY_MS;
    return {
      at: b.achievedAt,
      id: `pr-${b.exerciseId}`,
      exercise: b.name,
      value: `${b.kg} kg`,
      detail: `× ${b.reps} reps`,
      chip: {
        label: `${fresh ? 'NEW PR' : 'CONFIRMED'} · ${relativeAge(b.achievedAt, now)}`,
        tone: fresh ? 'primary' : 'neutral',
        icon: fresh ? 'star' : undefined,
      },
      icon: 'fitness_center',
      iconTone: 'neutral',
      footLeft: { text: `1RM Est: ${b.estimatedOneRepMax} kg`, tone: 'primary' },
    };
  });

  const bests = activityBests(activities);
  const runCards: (PersonalRecord & { at: number })[] = [];
  const longest =
    bests.longestKm !== null ? activities.find((a) => a.distanceKm === bests.longestKm) : undefined;
  if (longest) {
    runCards.push({
      at: longest.endedAt,
      id: 'pr-longest-run',
      exercise: 'Longest Run',
      value: `${longest.distanceKm.toFixed(1)} km`,
      detail: longest.avgPaceSecPerKm ? `${formatPace(longest.avgPaceSecPerKm)} /km` : '',
      chip: { label: `AEROBIC PEAK · ${relativeAge(longest.endedAt, now)}`, tone: 'secondary' },
      icon: 'directions_run',
      iconTone: 'secondary',
      footLeft: { text: `+${longest.elevationGainM} m elevation`, tone: 'secondary' },
    });
  }
  const fastest = bests.fastestSplit;
  const splitRun =
    fastest === null
      ? undefined
      : activities.find((a) => a.splits.some((s) => s.paceSecPerKm === fastest));
  if (fastest !== null && splitRun) {
    runCards.push({
      at: splitRun.endedAt,
      id: 'pr-fastest-km',
      exercise: 'Fastest Kilometre',
      value: formatPace(fastest),
      detail: '/km',
      chip: { label: `SPEED PEAK · ${relativeAge(splitRun.endedAt, now)}`, tone: 'secondary' },
      icon: 'speed',
      iconTone: 'secondary',
      footLeft: { text: 'Best single split', tone: 'secondary' },
    });
  }

  const all = [...liftCards, ...runCards].sort((a, b) => b.at - a.at);
  return { items: all.slice(0, limit).map(({ at: _at, ...card }) => card), totalCount: all.length };
}

function bodySnapshot(entry: WeightEntry | undefined, fallback: BodySnapshot): BodySnapshot {
  return {
    kg: entry?.kg ?? fallback.kg,
    bodyFatPercent: entry?.bodyFatPercent ?? fallback.bodyFatPercent,
    muscleKg: entry?.muscleKg ?? fallback.muscleKg,
  };
}

export function badges(
  workouts: readonly WorkoutRecord[],
  activities: readonly ActivityRecord[],
): Badge[] {
  const streak = longestStreak([...workouts, ...activities].map((r) => dateKey(r.startedAt)));
  const weekVolume = bestWeeklyVolume(workouts);
  const lifetimeVolume = Math.round(workouts.reduce((s, w) => s + w.volumeKg, 0));
  const fastestSplit = activityBests(activities).fastestSplit;
  const definitions: (Omit<Badge, 'status' | 'progress'> & {
    value: number;
    target: number;
    unit: string;
    showProgress?: boolean;
  })[] = [
    {
      id: 'iron',
      title: 'Iron Discipline',
      description: 'Complete 14 consecutive active days without a gap.',
      icon: 'workspace_premium',
      tone: 'primary',
      value: streak,
      target: 14,
      unit: 'days',
    },
    {
      id: 'titan',
      title: 'Hypertrophy Titan',
      description: 'Surpass 25,000 kg of lifting in a single week.',
      icon: 'military_tech',
      tone: 'neutral',
      value: weekVolume,
      target: 25_000,
      unit: 'kg',
    },
    {
      id: 'pace',
      title: 'Pace Breaker',
      description: 'Clock a sub-4\'50" kilometre split on a run.',
      icon: 'speed',
      tone: 'secondary',
      value: fastestSplit !== null && fastestSplit < 290 ? 1 : 0,
      target: 1,
      unit: '',
      showProgress: false,
    },
    {
      id: 'centurion',
      title: 'Centurion Club',
      description: 'Log 100 workouts in FitSphere.',
      icon: 'lock',
      tone: 'neutral',
      value: workouts.length,
      target: 100,
      unit: '',
    },
    {
      id: 'century-volume',
      title: 'Century Volume Club',
      description: 'Accumulate 100,000 kg of lifetime volume.',
      icon: 'lock',
      tone: 'neutral',
      value: lifetimeVolume,
      target: 100_000,
      unit: 'kg',
    },
  ];
  return definitions.map(({ value, target, unit, showProgress = true, ...badge }) => {
    const earned = value >= target;
    return {
      ...badge,
      icon: earned && badge.icon === 'lock' ? 'workspace_premium' : badge.icon,
      status: earned ? 'earned' : 'locked',
      ...(!earned && showProgress ? { progress: { current: value, target, unit } } : {}),
    };
  });
}

export function buildProgress(input: ProgressInput): ProgressOverview {
  const { now, profile, workouts, activities, weights } = input;
  const p = profile.profile;
  const activeKeys = [...workouts, ...activities].map((r) => dateKey(r.startedAt));
  const sortedWeights = [...weights].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  const first = sortedWeights[0];
  const latest = sortedWeights.at(-1);
  const fallback: BodySnapshot = { kg: p.weightKg, bodyFatPercent: 0, muscleKg: 0 };

  const weekStart = startOfWeek(now).getTime();
  const lastWeekStart = weekStart - 7 * DAY_MS;
  const volume = (from: number, to: number) =>
    workouts
      .filter((w) => w.startedAt >= from && w.startedAt < to)
      .reduce((s, w) => s + w.volumeKg, 0);
  const lastWeek = volume(lastWeekStart, weekStart);
  const thisWeek = volume(weekStart, now + 1);

  const monthKey = dateKey(now - 28 * DAY_MS);
  const monthChange = weightChange(sortedWeights, monthKey);
  const weeklyRate = monthChange === null ? 0 : monthChange / 4;
  const firstWorkout = Math.min(now, ...workouts.map((w) => w.startedAt));
  const week = (Math.floor(daysBetween(firstWorkout, now) / 7) % PROGRAM_WEEKS) + 1;
  const prs = personalRecordCards(workouts, activities, now);
  const middle = sortedWeights[Math.floor(sortedWeights.length / 2)];
  const earnedBadges = badges(workouts, activities);

  return {
    macrocycleLabel: `${goalById(p.goal).title} Macrocycle · Wk ${week}/${PROGRAM_WEEKS}`,
    streak: {
      days: currentStreak(activeKeys, now),
      bestStreak: longestStreak(activeKeys),
      weekDone: workouts.filter((w) => w.startedAt >= weekStart).length,
      weekTarget: p.daysPerWeek,
      heatmap: heatmap(now, workouts, activities),
    },
    synthesis: {
      weeklyVolumePercent: lastWeek > 0 ? round1(((thisWeek - lastWeek) / lastWeek) * 100) : null,
      milestoneKg: p.targetKg,
      weeksToMilestone: weeksToTarget(latest?.kg ?? p.weightKg, p.targetKg, weeklyRate),
    },
    personalRecords: prs,
    transformation: {
      dayNumber:
        first && latest
          ? daysBetween(
              new Date(`${first.dateKey}T00:00:00`),
              new Date(`${latest.dateKey}T00:00:00`),
            ) + 1
          : 1,
      baseline: bodySnapshot(first, fallback),
      current: bodySnapshot(latest, fallback),
      trajectory: {
        points: sortedWeights.map((w) => w.kg),
        weekDeltaKg: weightChange(sortedWeights, dateKey(now - 7 * DAY_MS)) ?? 0,
        targetKg: p.targetKg,
        midLabel: middle
          ? `Day ${daysBetween(new Date(`${first!.dateKey}T00:00:00`), new Date(`${middle.dateKey}T00:00:00`)) + 1} (${middle.kg} kg)`
          : '',
      },
    },
    badges: {
      items: earnedBadges,
      unlocked: earnedBadges.filter((b) => b.status === 'earned').length,
      total: earnedBadges.length,
    },
  };
}
