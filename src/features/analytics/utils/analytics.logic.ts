import type { VolumeBucket } from '../types/analytics.types';

export function totalVolume(buckets: readonly VolumeBucket[]): number {
  return buckets.reduce((sum, b) => sum + b.kg, 0);
}

/** Percent change vs the previous period, rounded to 1 decimal; null without a baseline. */
export function volumeDeltaPercent(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Index of the heaviest bucket; -1 when everything is zero. */
export function bestBucketIndex(buckets: readonly VolumeBucket[]): number {
  let best = -1;
  let max = 0;
  buckets.forEach((b, i) => {
    if (b.kg > max) {
      max = b.kg;
      best = i;
    }
  });
  return best;
}

/** 4200 → "4.2k"; 0 → "Rest". */
export function formatVolumeShort(kg: number): string {
  if (kg <= 0) return 'Rest';
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}k` : String(Math.round(kg));
}

export function signed(value: number, digits = 1): string {
  const rounded = Number(value.toFixed(digits));
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}

/**
 * Smooth SVG path (and closed area path) through `values`, scaled to width × height.
 * Quadratic curves through segment midpoints keep the line soft without overshooting.
 */
export function buildSparkline(
  values: readonly number[],
  width: number,
  height: number,
  padding = 2,
): { line: string; area: string } | null {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);
  const pts = values.map((v, i) => ({
    x: i * stepX,
    y: height - padding - ((v - min) / span) * (height - padding * 2),
  }));
  let line = `M${pts[0]!.x.toFixed(1)},${pts[0]!.y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!;
    const cur = pts[i]!;
    const midX = (prev.x + cur.x) / 2;
    const midY = (prev.y + cur.y) / 2;
    line += ` Q${prev.x.toFixed(1)},${prev.y.toFixed(1)} ${midX.toFixed(1)},${midY.toFixed(1)}`;
  }
  const last = pts[pts.length - 1]!;
  line += ` T${last.x.toFixed(1)},${last.y.toFixed(1)}`;
  return { line, area: `${line} L${width},${height} L0,${height} Z` };
}

export function shareSummary(athleteLine: string, rangeLabel: string, lines: string[]): string {
  return [`FitSphere performance report (${rangeLabel})`, athleteLine, '', ...lines].join('\n');
}
