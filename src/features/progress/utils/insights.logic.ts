import type { ActivityRecord } from '@/features/activities/types/activity.types';
import type { MuscleGroup, WorkoutRecord } from '@/features/workouts/types/workout-record.types';
import { dateKey } from '@/utils/date';

const DAY_MS = 86_400_000;
export const WEEKS = 8;

/** A common guideline for muscle growth: roughly 10 to 20 hard sets per muscle group each week. */
export const SETS_TARGET: readonly [number, number] = [10, 20];
export const SETS_SCALE_MAX = 24;

export const MUSCLES: readonly { id: MuscleGroup; label: string }[] = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'legs', label: 'Legs' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'core', label: 'Core' },
];

const round1 = (n: number) => Math.round(n * 10) / 10;
const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
const mean = (xs: readonly number[]) => (xs.length ? sum(xs) / xs.length : 0);

/** Epley estimate of the heaviest single rep a set implies. */
export const oneRepMax = (kg: number, reps: number): number =>
  reps <= 1 ? kg : round1(kg * (1 + reps / 30));

export interface WeekBucket {
  /** "8w" ... "Now". */
  label: string;
  /** Epoch ms where this 7-day window starts. */
  from: number;
  sessions: number;
  activeDays: number;
  volumeKg: number;
  sets: number;
  minutes: number;
  distanceKm: number;
}

export type Change = { percent: number | null; direction: 'up' | 'down' | 'flat' | 'none' };

/** Percent change against a baseline; `none` when there is nothing to compare with. */
export function changeVs(value: number, baseline: number): Change {
  if (baseline <= 0) return { percent: null, direction: 'none' };
  const percent = Math.round(((value - baseline) / baseline) * 100);
  return { percent, direction: percent > 2 ? 'up' : percent < -2 ? 'down' : 'flat' };
}

export interface StrengthTrend {
  id: string;
  name: string;
  muscle: MuscleGroup;
  sessions: number;
  /** Best estimated 1RM of each session, oldest first. */
  points: number[];
  current: number;
  start: number;
  changePercent: number;
  status: 'improving' | 'steady' | 'dipping' | 'baseline';
  bestSet: { kg: number; reps: number };
}

export interface MuscleLoad {
  id: MuscleGroup;
  label: string;
  sets: number;
  status: 'none' | 'low' | 'good' | 'high';
}

export interface TrainingInsights {
  weeks: WeekBucket[];
  /** The last 7 days, and the average of the 4 weeks before them. */
  thisWeek: WeekBucket;
  average: { sessions: number; volumeKg: number; minutes: number; distanceKm: number };
  load: { ratio: number | null; status: 'baseline' | 'light' | 'steady' | 'ramping' };
  strength: StrengthTrend[];
  muscles: MuscleLoad[];
  cardio: {
    totalKm: number;
    sessions: number;
    longestKm: number | null;
    paceNow: number | null;
    pacePrev: number | null;
  };
  consistency: {
    targetDays: number;
    weeksHit: number;
    bestWeekday: string | null;
    perWeek: number[];
  };
  hasData: boolean;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function buildInsights(input: {
  now: number;
  workouts: readonly WorkoutRecord[];
  activities: readonly ActivityRecord[];
  targetDays: number;
}): TrainingInsights {
  const { now, workouts, activities, targetDays } = input;

  // Eight rolling 7-day windows that end now, oldest first.
  const weeks: WeekBucket[] = Array.from({ length: WEEKS }, (_, i) => {
    const ago = WEEKS - 1 - i;
    return {
      label: ago === 0 ? 'Now' : `${ago}w`,
      from: now - (ago + 1) * 7 * DAY_MS,
      sessions: 0,
      activeDays: 0,
      volumeKg: 0,
      sets: 0,
      minutes: 0,
      distanceKm: 0,
    };
  });
  const indexOf = (at: number) => {
    const ago = Math.floor((now - at) / (7 * DAY_MS));
    return ago < 0 || ago >= WEEKS ? -1 : WEEKS - 1 - ago;
  };
  const daysSeen: Set<string>[] = weeks.map(() => new Set());

  for (const w of workouts) {
    const i = indexOf(w.startedAt);
    if (i < 0) continue;
    const b = weeks[i]!;
    b.sessions += 1;
    b.volumeKg += w.volumeKg;
    b.sets += w.setsCompleted;
    b.minutes += Math.round(w.durationSec / 60);
    daysSeen[i]!.add(dateKey(w.startedAt));
  }
  for (const a of activities) {
    const i = indexOf(a.startedAt);
    if (i < 0) continue;
    const b = weeks[i]!;
    b.sessions += 1;
    b.minutes += Math.round(a.durationSec / 60);
    b.distanceKm = round1(b.distanceKm + a.distanceKm);
    daysSeen[i]!.add(dateKey(a.startedAt));
  }
  weeks.forEach((b, i) => (b.activeDays = daysSeen[i]!.size));

  const thisWeek = weeks[WEEKS - 1]!;
  const prev4 = weeks.slice(WEEKS - 5, WEEKS - 1);
  const average = {
    sessions: round1(mean(prev4.map((w) => w.sessions))),
    volumeKg: Math.round(mean(prev4.map((w) => w.volumeKg))),
    minutes: Math.round(mean(prev4.map((w) => w.minutes))),
    distanceKm: round1(mean(prev4.map((w) => w.distanceKm))),
  };

  const ratio = average.volumeKg > 0 ? round1(thisWeek.volumeKg / average.volumeKg) : null;
  const load: TrainingInsights['load'] = {
    ratio,
    status:
      ratio === null ? 'baseline' : ratio > 1.3 ? 'ramping' : ratio < 0.7 ? 'light' : 'steady',
  };

  // Strength: the best estimated 1RM per session for each lift, over the whole window.
  const windowStart = weeks[0]!.from;
  const recent = [...workouts]
    .filter((w) => w.startedAt >= windowStart)
    .sort((a, b) => a.startedAt - b.startedAt);
  const byLift = new Map<
    string,
    { name: string; muscle: MuscleGroup; points: number[]; best: { kg: number; reps: number } }
  >();
  for (const w of recent) {
    for (const e of w.exercises) {
      if (e.sets.length === 0) continue;
      const entry = byLift.get(e.exerciseId) ?? {
        name: e.name,
        muscle: e.muscleGroup,
        points: [],
        best: { kg: 0, reps: 0 },
      };
      let top = 0;
      for (const s of e.sets) {
        const est = oneRepMax(s.kg, s.reps);
        top = Math.max(top, est);
        if (s.kg > entry.best.kg || (s.kg === entry.best.kg && s.reps > entry.best.reps)) {
          entry.best = { kg: s.kg, reps: s.reps };
        }
      }
      entry.points.push(top);
      byLift.set(e.exerciseId, entry);
    }
  }
  const strength = [...byLift.entries()]
    .map(([id, l]): StrengthTrend => {
      const start = l.points[0]!;
      const current = l.points.at(-1)!;
      const changePercent = start > 0 ? Math.round(((current - start) / start) * 100) : 0;
      const status: StrengthTrend['status'] =
        l.points.length < 2
          ? 'baseline'
          : changePercent >= 2
            ? 'improving'
            : changePercent <= -2
              ? 'dipping'
              : 'steady';
      return {
        id,
        name: l.name,
        muscle: l.muscle,
        sessions: l.points.length,
        points: l.points.slice(-8),
        current,
        start,
        changePercent,
        status,
        bestSet: l.best,
      };
    })
    .sort((a, b) => b.sessions - a.sessions || b.current - a.current)
    .slice(0, 5);

  // Sets per muscle group over the last 7 days.
  const setsByMuscle = new Map<MuscleGroup, number>();
  for (const w of workouts) {
    if (w.startedAt < now - 7 * DAY_MS || w.startedAt > now) continue;
    for (const e of w.exercises) {
      setsByMuscle.set(e.muscleGroup, (setsByMuscle.get(e.muscleGroup) ?? 0) + e.sets.length);
    }
  }
  const muscles: MuscleLoad[] = MUSCLES.map((m) => {
    const sets = setsByMuscle.get(m.id) ?? 0;
    return {
      id: m.id,
      label: m.label,
      sets,
      status:
        sets === 0
          ? 'none'
          : sets < SETS_TARGET[0]
            ? 'low'
            : sets > SETS_TARGET[1]
              ? 'high'
              : 'good',
    };
  });

  // Cardio over the whole window.
  const cardioRecords = activities.filter((a) => a.startedAt >= windowStart && a.startedAt <= now);
  const runs = cardioRecords.filter((a) => a.kind === 'run' && a.avgPaceSecPerKm);
  const paceOf = (list: ActivityRecord[]) =>
    list.length ? Math.round(mean(list.map((a) => a.avgPaceSecPerKm!))) : null;
  const split = now - 28 * DAY_MS;
  const cardio = {
    totalKm: round1(sum(cardioRecords.map((a) => a.distanceKm))),
    sessions: cardioRecords.length,
    longestKm: cardioRecords.length
      ? round1(Math.max(...cardioRecords.map((a) => a.distanceKm)))
      : null,
    paceNow: paceOf(runs.filter((a) => a.startedAt >= split)),
    pacePrev: paceOf(runs.filter((a) => a.startedAt < split)),
  };

  // Consistency.
  const perWeek = weeks.map((w) => w.activeDays);
  const weekdayCount = new Array<number>(7).fill(0);
  for (const r of [...workouts, ...activities]) {
    if (r.startedAt >= windowStart && r.startedAt <= now) {
      weekdayCount[new Date(r.startedAt).getDay()]! += 1;
    }
  }
  const topDay = Math.max(...weekdayCount);
  const consistency = {
    targetDays,
    weeksHit: perWeek.filter((d) => d >= targetDays).length,
    bestWeekday: topDay > 0 ? WEEKDAYS[weekdayCount.indexOf(topDay)]! : null,
    perWeek,
  };

  return {
    weeks,
    thisWeek,
    average,
    load,
    strength,
    muscles,
    cardio,
    consistency,
    hasData: weeks.some((w) => w.sessions > 0),
  };
}

/** "5'12\"" style pace from seconds per km. */
export function paceLabel(secPerKm: number | null): string {
  if (!secPerKm) return '--';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}'${String(s).padStart(2, '0')}"`;
}

export function formatVolume(kg: number): string {
  return Math.round(kg).toLocaleString('en-US');
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Short numbers for chart labels: 35300 becomes "35.3k". */
export const compactNumber = (n: number): string =>
  n >= 1000 ? `${round1(n / 1000)}k` : String(Math.round(n * 10) / 10);
