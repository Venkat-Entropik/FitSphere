import type { WeightEntry } from '@/features/profile/types/profile.types';
import { buildWeightHistory, shortDate } from '@/features/progress/utils/weight-history.logic';
import { addDays, dateKey } from '@/utils/date';

const NOW = new Date(2026, 10, 20, 12).getTime();
const entry = (daysAgo: number, kg: number): WeightEntry => ({
  id: `w${daysAgo}`,
  dateKey: dateKey(addDays(NOW, -daysAgo)),
  kg,
});

describe('buildWeightHistory', () => {
  const weights = [entry(40, 72), entry(10, 70.5), entry(5, 70), entry(1, 69.6), entry(0, 69.8)];

  it('limits the chart to the chosen range and spaces points by real days', () => {
    const month = buildWeightHistory(weights, NOW, '30D');
    expect(month.points.map((p) => p.kg)).toEqual([70.5, 70, 69.6, 69.8]);
    expect(month.points.map((p) => p.day)).toEqual([0, 5, 9, 10]);
    expect(buildWeightHistory(weights, NOW, 'All').points).toHaveLength(5);
  });

  it('summarises the range', () => {
    const h = buildWeightHistory(weights, NOW, '30D');
    expect(h.min).toBe(69.6);
    expect(h.max).toBe(70.5);
    expect(h.average).toBe(70);
    expect(h.changeKg).toBe(-0.7);
    expect(buildWeightHistory(weights, NOW, 'All').changeKg).toBe(-2.2);
  });

  it('measures how regularly you log over the last 30 days', () => {
    const h = buildWeightHistory(weights, NOW, '30D');
    expect(h.loggedDays).toBe(4);
    expect(h.frequencyPercent).toBe(13);
    expect(h.last30).toHaveLength(30);
    expect(h.last30.at(-1)).toBe(true);
    expect(h.last30.at(-2)).toBe(true);
    expect(h.last30.at(-3)).toBe(false);
  });

  it('counts a streak ending today, or yesterday if today is still open', () => {
    expect(buildWeightHistory(weights, NOW, '30D').streak).toBe(2);
    expect(buildWeightHistory([entry(1, 70), entry(2, 70), entry(3, 70)], NOW, '30D').streak).toBe(
      3,
    );
    expect(buildWeightHistory([entry(3, 70)], NOW, '30D').streak).toBe(0);
  });

  it('lists the latest weigh-ins with the change from the one before', () => {
    const h = buildWeightHistory(weights, NOW, '30D');
    expect(h.recent[0]).toMatchObject({ kg: 69.8, deltaKg: 0.2 });
    expect(h.recent[1]).toMatchObject({ kg: 69.6, deltaKg: -0.4 });
    expect(h.recent.at(-1)!.deltaKg).toBeNull(); // the very first entry ever
    expect(h.total).toBe(5);
  });

  it('copes with no data', () => {
    const h = buildWeightHistory([], NOW, '30D');
    expect(h).toMatchObject({ points: [], min: null, changeKg: null, loggedDays: 0, streak: 0 });
  });

  it('formats short dates', () => {
    expect(shortDate('2026-11-03')).toMatch(/3/);
    expect(shortDate('2026-11-03', true).length).toBeGreaterThan(shortDate('2026-11-03').length);
  });
});
