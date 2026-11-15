import {
  countCompleted,
  telemetryRings,
  weeklyFrequencyBars,
} from '@/features/dashboard/utils/telemetry';
import type {
  DailyTelemetry,
  WeeklyFrequencyDay,
} from '@/features/dashboard/types/dashboard.types';
import { formatDayLabel, getGreeting } from '@/utils/date';

const telemetry: DailyTelemetry = {
  activeBurnKcal: 420,
  activeBurnGoalKcal: 600,
  activeMinutes: 65,
  activeMinutesGoal: 60,
};
const weeklyFrequency: WeeklyFrequencyDay[] = [
  { label: 'M', status: 'completed', minutes: 65 },
  { label: 'T', status: 'completed', minutes: 50 },
  { label: 'W', status: 'completed', minutes: 75 },
  { label: 'T', status: 'today', minutes: 30 },
  { label: 'F', status: 'completed', minutes: 60 },
  { label: 'S', status: 'rest', minutes: 0 },
  { label: 'S', status: 'upcoming', minutes: 0 },
];

describe('telemetryRings', () => {
  it('computes per-ring progress and the rounded aggregate', () => {
    const { rings, aggregatePercent } = telemetryRings(telemetry);
    expect(rings.map((r) => r.color)).toEqual(['secondary', 'tertiary']);
    expect(rings[0]!.progress).toBeCloseTo(0.7);
    expect(rings[1]!.progress).toBe(1);
    expect(aggregatePercent).toBe(85);
  });

  it('caps progress at 100% and tolerates a zero goal', () => {
    const { rings } = telemetryRings({
      activeBurnKcal: 10,
      activeBurnGoalKcal: 0,
      activeMinutes: 99,
      activeMinutesGoal: 30,
    });
    expect(rings.map((r) => r.progress)).toEqual([0, 1]);
  });
});

describe('weekly frequency', () => {
  const bars = weeklyFrequencyBars(weeklyFrequency);

  it('scales bars to the longest session and marks today / rest days', () => {
    expect(bars[2]).toMatchObject({ ratio: 1, topLabel: '75m', variant: 'solid' });
    expect(bars[3]).toMatchObject({ topLabel: 'Now', variant: 'partial', highlighted: true });
    expect(bars[5]).toMatchObject({ ratio: 0, topLabel: 'Rest', variant: 'muted' });
    expect(bars[6]).toMatchObject({ ratio: 0, topLabel: undefined, variant: 'muted' });
  });

  it('counts only completed days', () => {
    expect(countCompleted(weeklyFrequency)).toBe(4);
  });
});

describe('formatting helpers', () => {
  it('picks a greeting by hour', () => {
    expect(getGreeting(new Date(2026, 9, 24, 8))).toBe('Good morning');
    expect(getGreeting(new Date(2026, 9, 24, 14))).toBe('Good afternoon');
    expect(getGreeting(new Date(2026, 9, 24, 21))).toBe('Good evening');
  });

  it('formats the day label', () => {
    expect(formatDayLabel(new Date(2026, 9, 24))).toBe('Saturday, Oct 24');
  });
});
