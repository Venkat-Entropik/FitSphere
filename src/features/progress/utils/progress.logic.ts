import type { Badge, BodySnapshot, HeatCell } from '../types/progress.types';

/** Share of the heat map's days that have a logged session. `days` is the window length. */
export function adherencePercent(heatmap: readonly HeatCell[], days: number): number {
  if (days <= 0) return 0;
  const active = new Set(heatmap.map((c) => c.day)).size;
  return Math.round(Math.min(1, active / days) * 100);
}

export interface BodyDelta {
  weightKg: number;
  bodyFatPercent: number;
  muscleKg: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function bodyDelta(baseline: BodySnapshot, current: BodySnapshot): BodyDelta {
  return {
    weightKg: round1(current.kg - baseline.kg),
    bodyFatPercent: round1(current.bodyFatPercent - baseline.bodyFatPercent),
    muscleKg: round1(current.muscleKg - baseline.muscleKg),
  };
}

export const signedDelta = (n: number): string => `${n > 0 ? '+' : ''}${n}`;

export function badgeProgressRatio(badge: Badge): number {
  const p = badge.progress;
  return p && p.target > 0 ? Math.min(1, Math.max(0, p.current / p.target)) : 0;
}

/** "74 / 100" or "62.8k / 100k kg" */
export function badgeProgressLabel(badge: Badge): string {
  const p = badge.progress;
  if (!p) return '';
  const fmt = (n: number) => (n >= 1000 ? `${Math.round((n / 1000) * 10) / 10}k` : String(n));
  return `${fmt(p.current)} / ${fmt(p.target)}${p.unit ? ` ${p.unit}` : ''}`;
}

export function countUnlocked(badges: readonly Badge[]): number {
  return badges.filter((b) => b.status === 'earned').length;
}

export function weeksToTarget(
  currentKg: number,
  targetKg: number,
  weeklyGainKg: number,
): number | null {
  if (weeklyGainKg <= 0 || targetKg <= currentKg) return null;
  return Math.ceil((targetKg - currentKg) / weeklyGainKg);
}
