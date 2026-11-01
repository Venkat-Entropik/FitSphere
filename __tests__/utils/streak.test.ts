import { addDays, dateKey } from '@/utils/date';
import { currentStreak, longestStreak } from '@/utils/streak';

const NOW = new Date(2026, 10, 4, 12).getTime(); // Wed 4 Nov 2026
const keys = (...agos: number[]) => agos.map((n) => dateKey(addDays(NOW, -n)));

describe('currentStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(currentStreak(keys(0, 1, 2), NOW)).toBe(3);
  });

  it('does not break when today is not logged yet', () => {
    expect(currentStreak(keys(1, 2, 3), NOW)).toBe(3);
  });

  it('breaks after a full missed day', () => {
    expect(currentStreak(keys(2, 3, 4), NOW)).toBe(0);
    expect(currentStreak(keys(0, 1, 3, 4), NOW)).toBe(2);
  });

  it('is 0 with no activity and ignores duplicates', () => {
    expect(currentStreak([], NOW)).toBe(0);
    expect(currentStreak([...keys(0), ...keys(0), ...keys(1)], NOW)).toBe(2);
  });
});

describe('longestStreak', () => {
  it('finds the longest run anywhere in history', () => {
    expect(longestStreak(keys(0, 1, 5, 6, 7, 8, 12))).toBe(4);
    expect(longestStreak([])).toBe(0);
    expect(longestStreak(keys(3))).toBe(1);
  });
});
