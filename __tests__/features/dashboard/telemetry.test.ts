import {
  countCompleted,
  formatSleep,
  telemetryRings,
  weeklyFrequencyBars,
} from '@/features/dashboard/utils/telemetry';
import { mockDashboardSummary } from '@/features/dashboard/services/dashboard.mock';
import { formatDayLabel, getGreeting } from '@/utils/date';

describe('telemetryRings', () => {
  it('computes per-ring progress and the rounded aggregate', () => {
    const { rings, aggregatePercent } = telemetryRings(mockDashboardSummary.telemetry);
    expect(rings.map((r) => r.color)).toEqual(['primary', 'secondary', 'tertiary']);
    expect(rings[0]!.progress).toBeCloseTo(0.842);
    expect(rings[2]!.progress).toBe(1);
    expect(aggregatePercent).toBe(85);
  });

  it('caps progress at 100% and tolerates a zero goal', () => {
    const { rings } = telemetryRings({
      steps: 20000,
      stepsGoal: 10000,
      activeBurnKcal: 10,
      activeBurnGoalKcal: 0,
      activeMinutes: 0,
      activeMinutesGoal: 30,
    });
    expect(rings.map((r) => r.progress)).toEqual([1, 0, 0]);
  });
});

describe('weekly frequency', () => {
  const bars = weeklyFrequencyBars(mockDashboardSummary.weeklyFrequency);

  it('scales bars to the longest session and marks today / rest days', () => {
    expect(bars[2]).toMatchObject({ ratio: 1, topLabel: '75m', variant: 'solid' });
    expect(bars[3]).toMatchObject({ topLabel: 'Now', variant: 'partial', highlighted: true });
    expect(bars[5]).toMatchObject({ ratio: 0, topLabel: 'Rest', variant: 'muted' });
  });

  it('counts only completed days', () => {
    expect(countCompleted(mockDashboardSummary.weeklyFrequency)).toBe(4);
  });
});

describe('formatting helpers', () => {
  it('formats sleep minutes', () => expect(formatSleep(465)).toBe('7h 45m'));

  it('picks a greeting by hour', () => {
    expect(getGreeting(new Date(2026, 9, 24, 8))).toBe('Good morning');
    expect(getGreeting(new Date(2026, 9, 24, 14))).toBe('Good afternoon');
    expect(getGreeting(new Date(2026, 9, 24, 21))).toBe('Good evening');
  });

  it('formats the day label', () => {
    expect(formatDayLabel(new Date(2026, 9, 24))).toBe('Saturday, Oct 24');
  });
});
