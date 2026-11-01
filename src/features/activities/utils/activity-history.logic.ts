import { startOfWeek } from '@/utils/date';

import type { ActivityRecord, ActivitySnapshot, LatLng } from '../types/activity.types';

const MAX_STORED_ROUTE_POINTS = 200;

/** Keeps the first and last points and evenly samples the rest, so stored routes stay small. */
export function downsampleRoute(route: readonly LatLng[], max = MAX_STORED_ROUTE_POINTS): LatLng[] {
  if (route.length <= max) return [...route];
  const step = (route.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => route[Math.round(i * step)]!);
}

export interface RecordTimes {
  id: string;
  startedAt: number;
  endedAt: number;
}

export function toActivityRecord(snapshot: ActivitySnapshot, times: RecordTimes): ActivityRecord {
  return {
    id: times.id,
    kind: snapshot.kind,
    title: snapshot.title,
    startedAt: times.startedAt,
    endedAt: times.endedAt,
    distanceKm: Math.round(snapshot.distanceKm * 1000) / 1000,
    durationSec: Math.round(snapshot.durationSec),
    movingSec: Math.round(snapshot.movingSec),
    avgPaceSecPerKm: snapshot.avgPaceSecPerKm,
    kcal: snapshot.kcal,
    elevationGainM: snapshot.elevationGainM,
    splits: snapshot.splits,
    route: downsampleRoute(snapshot.route),
    source: 'user',
  };
}

/** A recording with no distance and under 30 s is an accidental start, not an activity. */
export function isWorthSaving(
  snapshot: Pick<ActivitySnapshot, 'distanceKm' | 'durationSec' | 'kind'>,
): boolean {
  const gps = snapshot.kind === 'run' || snapshot.kind === 'cycle' || snapshot.kind === 'walk';
  return snapshot.durationSec >= 30 && (!gps || snapshot.distanceKm >= 0.01);
}

export interface ActivityTotals {
  count: number;
  distanceKm: number;
  durationSec: number;
  kcal: number;
}

export function activityTotals(
  records: readonly ActivityRecord[],
  fromMs: number,
  toMs = Infinity,
): ActivityTotals {
  const inRange = records.filter((r) => r.startedAt >= fromMs && r.startedAt < toMs);
  return {
    count: inRange.length,
    distanceKm: Math.round(inRange.reduce((s, r) => s + r.distanceKm, 0) * 100) / 100,
    durationSec: inRange.reduce((s, r) => s + r.durationSec, 0),
    kcal: inRange.reduce((s, r) => s + r.kcal, 0),
  };
}

/** Totals for the calendar week (Monday start) containing `now`. */
export const thisWeekTotals = (records: readonly ActivityRecord[], now: number): ActivityTotals =>
  activityTotals(records, startOfWeek(now).getTime());

export interface ActivityBests {
  longestKm: number | null;
  /** Lowest average pace (s/km) over runs of at least 1 km. */
  fastestAvgPace: number | null;
  /** Lowest single-kilometre split (s/km). */
  fastestSplit: number | null;
  mostElevationM: number | null;
}

export function activityBests(records: readonly ActivityRecord[]): ActivityBests {
  const gps = records.filter((r) => r.distanceKm > 0);
  const paced = gps.filter((r) => r.distanceKm >= 1 && r.avgPaceSecPerKm !== null);
  const splits = gps.flatMap((r) => r.splits.map((s) => s.paceSecPerKm));
  return {
    longestKm: gps.length ? Math.max(...gps.map((r) => r.distanceKm)) : null,
    fastestAvgPace: paced.length ? Math.min(...paced.map((r) => r.avgPaceSecPerKm!)) : null,
    fastestSplit: splits.length ? Math.min(...splits) : null,
    mostElevationM: gps.length ? Math.max(...gps.map((r) => r.elevationGainM)) : null,
  };
}

export function sortRecentFirst(records: readonly ActivityRecord[]): ActivityRecord[] {
  return [...records].sort((a, b) => b.endedAt - a.endedAt);
}
