import type { RingSpec } from '@/components/charts/ProgressRing';

import type { DailyTelemetry, WeeklyFrequencyDay } from '../types/dashboard.types';

const ratio = (value: number, goal: number) => (goal > 0 ? Math.min(1, value / goal) : 0);

/** Outer → inner: steps (lime), burn (cyan), active minutes (violet). */
export function telemetryRings(t: DailyTelemetry): { rings: RingSpec[]; aggregatePercent: number } {
  const rings: RingSpec[] = [
    { progress: ratio(t.steps, t.stepsGoal), color: 'primary' },
    { progress: ratio(t.activeBurnKcal, t.activeBurnGoalKcal), color: 'secondary' },
    { progress: ratio(t.activeMinutes, t.activeMinutesGoal), color: 'tertiary' },
  ];
  const average = rings.reduce((sum, r) => sum + r.progress, 0) / rings.length;
  return { rings, aggregatePercent: Math.round(average * 100) };
}

/** Bar height is relative to the longest session in the week. */
export function weeklyFrequencyBars(days: readonly WeeklyFrequencyDay[]) {
  const longest = Math.max(1, ...days.map((d) => d.minutes));
  return days.map((d) => ({
    label: d.label,
    ratio: d.status === 'rest' || d.status === 'upcoming' ? 0 : d.minutes / longest,
    topLabel:
      d.status === 'today'
        ? 'Now'
        : d.status === 'completed'
          ? `${d.minutes}m`
          : d.status === 'rest'
            ? 'Rest'
            : undefined,
    variant:
      d.status === 'today'
        ? ('partial' as const)
        : d.status === 'completed'
          ? ('solid' as const)
          : ('muted' as const),
    highlighted: d.status === 'today',
  }));
}

export function countCompleted(days: readonly WeeklyFrequencyDay[]): number {
  return days.filter((d) => d.status === 'completed').length;
}

export function formatSleep(totalMinutes: number): string {
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}
