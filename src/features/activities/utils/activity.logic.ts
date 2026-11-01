import type {
  ActivityKind,
  ActivitySnapshot,
  GpsPoint,
  GpsQuality,
  KindOption,
  LatLng,
  Split,
} from '../types/activity.types';

export const KIND_OPTIONS: readonly KindOption[] = [
  { kind: 'run', label: 'Outdoor Run', icon: 'directions_run', usesGps: true },
  { kind: 'cycle', label: 'Cycling', icon: 'pedal_bike', usesGps: true },
  { kind: 'walk', label: 'Trail Walk', icon: 'hiking', usesGps: true },
  { kind: 'cardio', label: 'Cardio', icon: 'fitness_center', usesGps: false },
  { kind: 'hiit', label: 'HIIT', icon: 'timer', usesGps: false },
];

export const kindUsesGps = (kind: ActivityKind): boolean =>
  KIND_OPTIONS.find((o) => o.kind === kind)?.usesGps ?? false;

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Points with poor accuracy would add phantom distance when standing still, so they are skipped. */
const MAX_ACCEPTED_ACCURACY_M = 50;
/** Segments faster than this (m/s) are GPS jumps, not human movement (~65 km/h). */
const MAX_PLAUSIBLE_SPEED_MS = 18;
/** Below this speed (m/s) the athlete counts as stopped. */
const MOVING_SPEED_MS = 0.5;

export function isUsablePoint(p: GpsPoint): boolean {
  return p.accuracy === null || p.accuracy <= MAX_ACCEPTED_ACCURACY_M;
}

interface Segment {
  from: GpsPoint;
  to: GpsPoint;
  meters: number;
  seconds: number;
}

/** Consecutive usable points as validated segments (bad accuracy / impossible jumps dropped). */
export function toSegments(points: readonly GpsPoint[]): Segment[] {
  const usable = points.filter(isUsablePoint);
  const segments: Segment[] = [];
  for (let i = 1; i < usable.length; i++) {
    const from = usable[i - 1]!;
    const to = usable[i]!;
    const seconds = (to.timestamp - from.timestamp) / 1000;
    if (seconds <= 0) continue;
    const meters = haversineMeters(from, to);
    if (meters / seconds > MAX_PLAUSIBLE_SPEED_MS) continue;
    segments.push({ from, to, meters, seconds });
  }
  return segments;
}

export function distanceKm(points: readonly GpsPoint[]): number {
  return toSegments(points).reduce((sum, s) => sum + s.meters, 0) / 1000;
}

export function movingSeconds(points: readonly GpsPoint[]): number {
  return toSegments(points)
    .filter((s) => s.meters / s.seconds >= MOVING_SPEED_MS)
    .reduce((sum, s) => sum + s.seconds, 0);
}

/** Pace over the most recent window; null until enough distance has been covered. */
export function currentPaceSecPerKm(points: readonly GpsPoint[], windowSec = 30): number | null {
  const segments = toSegments(points);
  if (segments.length === 0) return null;
  const end = segments[segments.length - 1]!.to.timestamp;
  const recent = segments.filter((s) => end - s.to.timestamp <= windowSec * 1000);
  const meters = recent.reduce((sum, s) => sum + s.meters, 0);
  const seconds = recent.reduce((sum, s) => sum + s.seconds, 0);
  return meters >= 15 ? (seconds / meters) * 1000 : null;
}

export function averagePaceSecPerKm(distance: number, movingSec: number): number | null {
  return distance >= 0.05 && movingSec > 0 ? movingSec / distance : null;
}

/** One entry per completed kilometre, with boundary times interpolated between GPS fixes. */
export function computeSplits(points: readonly GpsPoint[]): Split[] {
  const segments = toSegments(points);
  const splits: Omit<Split, 'isFastest'>[] = [];
  let cumulative = 0;
  let elapsed = 0;
  let lastBoundaryElapsed = 0;
  let nextBoundary = 1000;

  for (const s of segments) {
    while (cumulative + s.meters >= nextBoundary) {
      const fraction = (nextBoundary - cumulative) / s.meters;
      const boundaryElapsed = elapsed + s.seconds * fraction;
      splits.push({ km: splits.length + 1, paceSecPerKm: boundaryElapsed - lastBoundaryElapsed });
      lastBoundaryElapsed = boundaryElapsed;
      nextBoundary += 1000;
    }
    cumulative += s.meters;
    elapsed += s.seconds;
  }

  const fastest = splits.length ? Math.min(...splits.map((x) => x.paceSecPerKm)) : 0;
  return splits.map((x) => ({ ...x, isFastest: x.paceSecPerKm === fastest }));
}

const ASCENT_THRESHOLD_M = 1;
const GRADE_WINDOW_M = 20;

/**
 * Total ascent and steepest grade. Altitude arrives in small steps, so ascent accumulates against a
 * reference height (counted once it has risen by the threshold) instead of per-fix deltas, and grade is
 * measured over ~20 m windows to avoid GPS-noise spikes.
 */
export function elevationStats(points: readonly GpsPoint[]): {
  gainM: number;
  maxGradePct: number | null;
} {
  let gain = 0;
  let reference: number | null = null;
  let maxGrade: number | null = null;
  let windowMeters = 0;
  let windowStartAltitude: number | null = null;

  for (const s of toSegments(points)) {
    const altitude = s.to.altitude;
    if (altitude === null) continue;

    if (reference === null) reference = altitude;
    else if (altitude - reference >= ASCENT_THRESHOLD_M) {
      gain += altitude - reference;
      reference = altitude;
    } else if (altitude < reference) reference = altitude;

    if (windowStartAltitude === null) windowStartAltitude = s.from.altitude ?? altitude;
    windowMeters += s.meters;
    if (windowMeters >= GRADE_WINDOW_M) {
      const grade = (Math.abs(altitude - windowStartAltitude) / windowMeters) * 100;
      maxGrade = maxGrade === null ? grade : Math.max(maxGrade, grade);
      windowMeters = 0;
      windowStartAltitude = altitude;
    }
  }
  return {
    gainM: Math.round(gain),
    maxGradePct: maxGrade === null ? null : Math.round(maxGrade * 10) / 10,
  };
}

export function gpsQuality(points: readonly GpsPoint[]): GpsQuality {
  const last = points[points.length - 1];
  if (!last || last.accuracy === null) return last ? 'medium' : 'none';
  if (last.accuracy <= 10) return 'high';
  if (last.accuracy <= 30) return 'medium';
  return 'low';
}

/** Rough energy estimate (kcal) from distance or time and body weight — an estimate, not a measurement. */
export function estimateKcal(
  kind: ActivityKind,
  weightKg: number,
  distance: number,
  durationSec: number,
): number {
  const perKgPerKm: Partial<Record<ActivityKind, number>> = { run: 1.04, walk: 0.5, cycle: 0.3 };
  const factor = perKgPerKm[kind];
  if (factor !== undefined) return Math.round(weightKg * distance * factor);
  const met = kind === 'hiit' ? 8 : 6;
  return Math.round(met * weightKg * (durationSec / 3600));
}

export interface SnapshotInput {
  kind: ActivityKind;
  title: string;
  points: readonly GpsPoint[];
  durationSec: number;
  weightKg: number;
  targetPaceSecPerKm: number | null;
  lapCount: number;
}

export function buildSnapshot(input: SnapshotInput): ActivitySnapshot {
  const { kind, points, durationSec } = input;
  const distance = distanceKm(points);
  const moving = Math.min(durationSec, movingSeconds(points));
  const elevation = elevationStats(points);
  return {
    kind,
    isDemo: false,
    title: input.title,
    distanceKm: distance,
    durationSec,
    movingSec: moving,
    currentPaceSecPerKm: currentPaceSecPerKm(points),
    avgPaceSecPerKm: averagePaceSecPerKm(distance, moving),
    targetPaceSecPerKm: input.targetPaceSecPerKm,
    kcal: estimateKcal(kind, input.weightKg, distance, durationSec),
    elevationGainM: elevation.gainM,
    maxGradePct: elevation.maxGradePct,
    heartRateBpm: null,
    heartZone: null,
    cadenceSpm: null,
    splits: computeSplits(points),
    route: points.filter(isUsablePoint).map(({ lat, lng }) => ({ lat, lng })),
    gpsQuality: gpsQuality(points),
    lapCount: input.lapCount,
  };
}

/** 4'48" */
export function formatPace(secPerKm: number | null): string {
  if (secPerKm === null || !Number.isFinite(secPerKm) || secPerKm <= 0) return '--\'--"';
  const total = Math.round(secPerKm);
  return `${Math.floor(total / 60)}'${String(total % 60).padStart(2, '0')}"`;
}

/** 31:45, or 1:02:09 past an hour. */
export function formatDuration(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Fits the route inside a width × height box (equirectangular, aspect preserved) and returns an SVG path.
 * Returns null when there are fewer than two distinct points.
 */
export function projectRoute(
  route: readonly LatLng[],
  width: number,
  height: number,
  padding = 24,
): { path: string; start: { x: number; y: number }; end: { x: number; y: number } } | null {
  if (route.length < 2) return null;
  const lat0 = route.reduce((s, p) => s + p.lat, 0) / route.length;
  const kx = Math.cos(toRad(lat0));
  const xs = route.map((p) => p.lng * kx);
  const ys = route.map((p) => -p.lat);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  if (spanX === 0 && spanY === 0) return null;
  const scale = Math.min(
    (width - padding * 2) / (spanX || 1e-9),
    (height - padding * 2) / (spanY || 1e-9),
  );
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;
  const pts = xs.map((x, i) => ({
    x: offsetX + (x - minX) * scale,
    y: offsetY + (ys[i]! - minY) * scale,
  }));
  const path = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  return { path, start: pts[0]!, end: pts[pts.length - 1]! };
}

/** Rule-based pacing cue from real data (not an AI model). */
export function pacerCue(
  s: Pick<ActivitySnapshot, 'avgPaceSecPerKm' | 'targetPaceSecPerKm' | 'distanceKm'>,
): {
  headline: string;
  detail: string;
} | null {
  if (s.avgPaceSecPerKm === null || s.targetPaceSecPerKm === null || s.distanceKm < 0.5)
    return null;
  const diff = Math.round(s.targetPaceSecPerKm - s.avgPaceSecPerKm);
  if (Math.abs(diff) < 3)
    return { headline: 'on target pace', detail: 'Hold this effort and keep your rhythm steady.' };
  return diff > 0
    ? {
        headline: `${diff} seconds per km ahead`,
        detail: 'You are faster than target — settle in so you have energy for the finish.',
      }
    : {
        headline: `${-diff} seconds per km behind`,
        detail: 'Lift your cadence slightly to close the gap to your target pace.',
      };
}
