import { EXERCISE_CATALOG, WORKOUT_PLANS } from '@/features/workouts/services/catalog.mock';
import type { WorkoutRecord } from '@/features/workouts/types/workout-record.types';
import {
  buildSessionFromPlan,
  repeatLastSession,
} from '@/features/workouts/utils/workout-history.logic';
import { sampleMembership, sampleSensors } from '@/features/profile/services/sample-account.mock';
import {
  cadenceSummary,
  goalTrajectory,
  headerStats,
  intakeSummary,
  proteinNote,
} from '@/features/profile/utils/profile.stats';
import { buildTelemetryExport } from '@/features/profile/utils/telemetry-export';
import { parseNumberInput } from '@/features/profile/utils/profile.view';
import { buildSeed } from '@/services/mock-db/seed';

const NOW = new Date(2026, 10, 4, 12).getTime();
const seed = buildSeed(NOW);

describe('headerStats', () => {
  it('summarises mass, height, latest body fat, streak and goal', () => {
    const s = headerStats({ now: NOW, ...seed });
    expect(s).toMatchObject({
      massKg: 68.5,
      heightCm: 175,
      bodyFatPercent: 13.8,
      streak: 14,
      goalSubtitle: 'Hypertrophic Adaptation',
    });
    expect(['I', 'II']).toContain(s.phase);
  });

  it('has no body-fat value without measurements, and starts in phase I with no history', () => {
    const s = headerStats({
      now: NOW,
      profile: seed.profile,
      weights: [{ id: 'a', dateKey: '2026-11-01', kg: 70 }],
      workouts: [],
      activities: [],
    });
    expect(s.bodyFatPercent).toBeNull();
    expect(s.streak).toBe(0);
    expect(s.phase).toBe('I');
  });

  it('moves to phase II in the second half of the six-week block', () => {
    const old = { ...seed.workouts[0]!, startedAt: NOW - 30 * 86_400_000 } as WorkoutRecord;
    expect(
      headerStats({ now: NOW, profile: seed.profile, weights: [], workouts: [old], activities: [] })
        .phase,
    ).toBe('II');
  });
});

describe('goalTrajectory', () => {
  it('shows progress between the first weigh-in and the target', () => {
    const t = goalTrajectory(seed.profile, seed.weights);
    expect(t.label).toBe('Lean Muscle Gain');
    expect(t.deltaText).toBe('+3.5');
    expect(t.progress).toBeCloseTo((68.5 - 67.2) / (72 - 67.2), 5);
    expect(t.targetText).toBe('Target: 72.0 kg (68.5 kg current)');
  });

  it('handles cutting, being at target and moving the wrong way', () => {
    const cut = {
      ...seed.profile,
      profile: { ...seed.profile.profile, goal: 'fat_loss' as const, targetKg: 64 },
    };
    expect(goalTrajectory(cut, seed.weights)).toMatchObject({
      label: 'Fat Loss',
      deltaText: '-4.5',
      progress: 0,
    }); // gained since the first weigh-in
    const at = { ...seed.profile, profile: { ...seed.profile.profile, targetKg: 68.5 } };
    expect(goalTrajectory(at, []).progress).toBe(1);
    expect(goalTrajectory(at, []).deltaText).toBe('0');
  });
});

describe('intake / cadence / misc', () => {
  it('computes calories left and percent met, capped at the budget', () => {
    expect(intakeSummary(2150, 2600)).toMatchObject({ left: 450, logged: 2150, percentMet: 83 });
    expect(intakeSummary(3000, 2600)).toMatchObject({ left: 0, percentMet: 100, progress: 1 });
    expect(intakeSummary(500, 0)).toMatchObject({ percentMet: 0, progress: 0 });
  });

  it('describes the weekly split', () => {
    expect(cadenceSummary(seed.profile)).toEqual({ days: 5, split: 'Push • Pull • Legs' });
    expect(
      cadenceSummary({ ...seed.profile, profile: { ...seed.profile.profile, daysPerWeek: 4 } })
        .split,
    ).toBe('Upper • Lower');
    expect(proteinNote(2.05)).toBe('2.05g per kg total body mass');
  });

  it('parses decimal input strictly', () => {
    expect(parseNumberInput(' 68,5 ')).toBe(68.5);
    expect(parseNumberInput('abc')).toBeNull();
    expect(parseNumberInput('')).toBeNull();
    expect(parseNumberInput('-4')).toBeNull();
  });

  it('labels sample devices and membership as data, not live connections', () => {
    expect(sampleSensors).toHaveLength(4);
    expect(sampleMembership.title).toContain('Elite');
  });
});

describe('buildTelemetryExport', () => {
  it('serialises the athlete data as parseable JSON, keeping sample flags', () => {
    const json = buildTelemetryExport({ exportedAt: NOW, ...seed });
    const parsed = JSON.parse(json);
    expect(parsed.app).toBe('FitSphere');
    expect(parsed.exportedAt).toBe(new Date(NOW).toISOString());
    expect(parsed.profile.identity.name).toBe('Alex Chen');
    expect(parsed.weights).toHaveLength(seed.weights.length);
    expect(parsed.workouts.every((w: WorkoutRecord) => w.source === 'sample')).toBe(true);
  });
});

describe('auto-progressive overload preference', () => {
  const history: WorkoutRecord[] = [
    {
      ...seed.workouts[0]!,
      id: 'h',
      planId: 'push-day',
      endedAt: 1000,
      exercises: [
        {
          exerciseId: 'incline-db-press',
          name: 'x',
          muscleGroup: 'chest',
          sets: [10, 10, 10, 10].map((reps) => ({ kg: 30, reps, isPersonalRecord: false })),
        },
      ],
    },
  ];
  const incline = EXERCISE_CATALOG.find((e) => e.id === 'incline-db-press')!;

  it('repeats the last working weight and best reps when switched off', () => {
    expect(repeatLastSession(incline, [history[0]!.exercises[0]!.sets])).toMatchObject({
      kg: 30,
      reps: 10,
      reason: 'repeat',
    });
    expect(repeatLastSession(incline, [])).toMatchObject({ kg: 24, reps: 8, reason: 'start' });
  });

  it('builds the next session with progression on, and without it when off', () => {
    const on = buildSessionFromPlan(WORKOUT_PLANS[0]!, EXERCISE_CATALOG, history, NOW);
    const off = buildSessionFromPlan(WORKOUT_PLANS[0]!, EXERCISE_CATALOG, history, NOW, {
      autoOverload: false,
    });
    expect(on.exercises[0]!.sets[0]).toMatchObject({ kg: 32, reps: 8 }); // every set hit 10 → add 2 kg
    expect(off.exercises[0]!.sets[0]).toMatchObject({ kg: 30, reps: 10 });
  });
});
