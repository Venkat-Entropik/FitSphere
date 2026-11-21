import {
  cardioCopy,
  consistencyCopy,
  muscleCopy,
  strengthCopy,
  summaryCopy,
  tileSummary,
  volumeCopy,
} from '@/features/progress/utils/insights.copy';
import {
  buildInsights,
  type MuscleLoad,
  type StrengthTrend,
} from '@/features/progress/utils/insights.logic';

const NOW = new Date(2026, 10, 20, 12).getTime();
const empty = buildInsights({ now: NOW, workouts: [], activities: [], targetDays: 3 });

const muscle = (id: MuscleLoad['id'], label: string, sets: number, status: MuscleLoad['status']) =>
  ({ id, label, sets, status }) satisfies MuscleLoad;

const trend = (status: StrengthTrend['status'], name = 'Bench'): StrengthTrend => ({
  id: name,
  name,
  muscle: 'chest',
  sessions: 3,
  points: [80, 85],
  current: 85,
  start: 80,
  changePercent: 6,
  status,
  bestSet: { kg: 80, reps: 5 },
});

describe('insight copy', () => {
  it('invites the first workout when nothing is logged', () => {
    expect(summaryCopy(empty).headline).toMatch(/No training logged/);
    expect(consistencyCopy(empty).headline).toBe('Nothing logged yet');
    expect(cardioCopy(empty).headline).toBe('No activities recorded yet');
    expect(muscleCopy(empty.muscles).headline).toBe('No sets in the last 7 days');
    expect(strengthCopy([]).headline).toBe('No lifts logged yet');
  });

  it('always explains the measure, not just the number', () => {
    expect(volumeCopy(empty).detail).toMatch(/weight lifted times reps/);
    expect(strengthCopy([]).detail).toMatch(/one-rep max/);
    expect(muscleCopy(empty.muscles).detail).toMatch(/10 to 20/);
  });

  it('names what to fix in muscle balance', () => {
    const missing = [muscle('chest', 'Chest', 14, 'good'), muscle('core', 'Core', 0, 'none')];
    expect(muscleCopy(missing).headline).toBe('Core has had no work');
    const low = [muscle('chest', 'Chest', 4, 'low'), muscle('back', 'Back', 12, 'good')];
    expect(muscleCopy(low).headline).toBe('Chest could use more sets');
    const fine = [muscle('chest', 'Chest', 12, 'good')];
    expect(muscleCopy(fine).headline).toBe('Every muscle group is in the target range');
  });

  it('summarises strength by what changed', () => {
    expect(strengthCopy([trend('improving'), trend('improving', 'Row')]).headline).toBe(
      '2 lifts getting stronger',
    );
    const dip = strengthCopy([trend('dipping', 'Squat')]);
    expect(dip.headline).toBe('Squat has dipped lately');
    expect(dip.detail).toMatch(/fatigue/);
    expect(strengthCopy([trend('baseline')]).headline).toBe('Building your baseline');
    expect(strengthCopy([trend('steady')]).headline).toBe('Your lifts are holding steady');
  });

  it('builds four tiles with a change for each', () => {
    const tiles = tileSummary(empty);
    expect(tiles.map((t) => t.label)).toEqual(['Sessions', 'Volume', 'Time', 'Distance']);
    expect(tiles.every((t) => t.change.direction === 'none')).toBe(true);
  });
});
