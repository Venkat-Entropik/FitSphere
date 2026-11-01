import { WORKOUT_PLANS } from '@/features/workouts/services/catalog.mock';
import {
  buildDashboard,
  dailyLogs,
  recentLogs,
  recoveryScore,
  relativeDay,
  weekDays,
} from '@/features/dashboard/utils/dashboard.aggregate';
import type { WorkoutRecord } from '@/features/workouts/types/workout-record.types';
import { buildSeed } from '@/services/mock-db/seed';

const NOW = new Date(2026, 10, 4, 12).getTime(); // Wed 4 Nov 2026
const seed = buildSeed(NOW);
const base = { now: NOW, profile: seed.profile, plans: WORKOUT_PLANS };

const todayWorkout = (volumeKg: number, endedAt = NOW): WorkoutRecord => ({
  ...seed.workouts[0]!,
  id: 'today',
  startedAt: endedAt - 3_000_000,
  endedAt,
  durationSec: 3000,
  volumeKg,
  kcal: 300,
  setsCompleted: 12,
  prCount: 1,
  source: 'user',
});

describe('buildDashboard', () => {
  it('reflects the seeded 14-day streak and an empty day so far', () => {
    const d = buildDashboard({ ...base, workouts: seed.workouts, activities: seed.activities });
    expect(d.streakDays).toBe(14);
    expect(d.athleteName).toBe('Alex');
    expect(d.weeklyTargetDays).toBe(5);
    expect(d.telemetry.activeBurnKcal).toBe(0);
    expect(d.telemetry.activeMinutes).toBe(0);
    expect(d.todaysWorkout.exercises.length).toBeGreaterThan(0);
  });

  it("this week's frequency marks past, today and upcoming days correctly", () => {
    const d = buildDashboard({ ...base, workouts: seed.workouts, activities: seed.activities });
    expect(d.weeklyFrequency.map((x) => x.status)).toEqual([
      'completed',
      'completed',
      'today',
      'upcoming',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
  });

  it('finishing a workout today updates burn, minutes, week and streak', () => {
    const d = buildDashboard({
      ...base,
      workouts: [...seed.workouts, todayWorkout(9000)],
      activities: seed.activities,
    });
    expect(d.telemetry.activeBurnKcal).toBe(300);
    expect(d.telemetry.activeMinutes).toBe(50);
    expect(d.weeklyFrequency[2]).toMatchObject({ status: 'completed', minutes: 50 });
    expect(d.insight.completedWorkouts).toBe(3);
    expect(d.recentLogs[0]).toMatchObject({ kcal: 300, caption: '9,000 kg' });
    expect(d.recentLogs[0]!.subtitle).toBe('Today • 12 sets • 1 PR');
  });

  it('copes with no history', () => {
    const d = buildDashboard({ ...base, workouts: [], activities: [] });
    expect(d.streakDays).toBe(0);
    expect(d.recentLogs).toEqual([]);
    expect(d.weekNumber).toBe(1);
    expect(d.recovery.score).toBe(98);
  });
});

describe('recoveryScore', () => {
  it('is high when rested and drops after a recent heavy session, then recovers over time', () => {
    const rested = recoveryScore(seed.workouts, seed.activities, NOW);
    const justTrained = recoveryScore(
      [...seed.workouts, todayWorkout(20_000)],
      seed.activities,
      NOW,
    );
    const longAgo = recoveryScore([todayWorkout(20_000, NOW - 47 * 3_600_000)], [], NOW);
    expect(justTrained).toBeLessThan(rested);
    expect(longAgo).toBeGreaterThan(justTrained);
    expect(justTrained).toBeGreaterThanOrEqual(55);
    expect(rested).toBeLessThanOrEqual(98);
  });
});

describe('helpers', () => {
  it('labels days relative to today', () => {
    expect(relativeDay(NOW, NOW)).toBe('Today');
    expect(relativeDay(NOW - 86_400_000, NOW)).toBe('Yesterday');
    expect(relativeDay(new Date(2026, 10, 1).getTime(), NOW)).toBe('Sunday');
  });

  it('sums minutes and calories per day across workouts and runs', () => {
    const logs = dailyLogs(seed.workouts, seed.activities);
    expect(logs.size).toBeGreaterThan(14);
    expect(weekDays(NOW, logs)).toHaveLength(7);
  });

  it('merges workouts and activities newest first, limited', () => {
    const logs = recentLogs(seed.workouts, seed.activities, NOW, 3);
    expect(logs).toHaveLength(3);
    expect(logs[0]!.subtitle.startsWith('Yesterday')).toBe(true);
  });
});
