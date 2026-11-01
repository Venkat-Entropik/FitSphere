import { buildSeed, DEFAULT_DRAFT } from '@/services/mock-db/seed';
import {
  profileService,
  ProfileValidationError,
} from '@/features/profile/services/profile.service';
import type { UserProfile } from '@/features/profile/types/profile.types';
import {
  applyProfilePatch,
  bmi,
  kgToTarget,
  latestWeight,
  nutritionTargets,
  upsertWeight,
  weightChange,
} from '@/features/profile/utils/profile.logic';
import { useMockDb } from '@/services/mock-db/mock-db';

const profile: UserProfile = { ...DEFAULT_DRAFT, updatedAt: 0 };

describe('nutritionTargets', () => {
  it('matches the reference athlete: ~2,600 kcal, 140 g protein, 70 g fat', () => {
    const t = nutritionTargets(profile.profile, 28);
    expect(t.budgetKcal).toBe(2600);
    expect(t.protein).toBe(140);
    expect(t.fat).toBe(70);
    expect(t.carbs).toBe(Math.round((2600 - 140 * 4 - 70 * 9) / 4));
    expect(t.hydrationGoalMl).toBe(3400);
  });

  it('adjusts for the goal and recalculates with body weight', () => {
    const cut = nutritionTargets({ ...profile.profile, goal: 'fat_loss' }, 28);
    expect(cut.budgetKcal).toBe(2200);
    expect(cut.protein).toBe(151); // 2.2 g/kg × 68.5
    const heavier = nutritionTargets({ ...profile.profile, weightKg: 80 }, 28);
    expect(heavier.protein).toBe(164);
    expect(heavier.budgetKcal).toBeGreaterThan(2600);
  });

  it('never returns negative carbs', () => {
    const t = nutritionTargets(
      { ...profile.profile, goal: 'fat_loss', weightKg: 250, daysPerWeek: 1 },
      80,
    );
    expect(t.carbs).toBeGreaterThanOrEqual(0);
  });
});

describe('applyProfilePatch', () => {
  it('merges valid changes immutably and stamps updatedAt', () => {
    const result = applyProfilePatch(profile, { weightKg: 70, daysPerWeek: 4 }, 99);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.profile.profile).toMatchObject({ weightKg: 70, daysPerWeek: 4, heightCm: 175 });
      expect(result.profile.updatedAt).toBe(99);
    }
    expect(profile.profile.weightKg).toBe(68.5);
  });

  it.each([
    [{ heightCm: 90 }, 'heightCm'],
    [{ weightKg: 500 }, 'weightKg'],
    [{ daysPerWeek: 0 }, 'daysPerWeek'],
    [{ daysPerWeek: 2.5 }, 'daysPerWeek'],
    [{ goal: 'nope' as never }, 'goal'],
  ])('rejects %p with a field error', (patch, field) => {
    const result = applyProfilePatch(profile, patch, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toContain(field);
  });

  it('rejects unknown fields', () => {
    expect(applyProfilePatch(profile, { admin: true } as never, 1).ok).toBe(false);
  });
});

describe('weight log helpers', () => {
  const entry = (dateKey: string, kg: number) => ({ id: dateKey, dateKey, kg });

  it('keeps one entry per day, sorted', () => {
    const list = upsertWeight(
      [entry('2026-11-03', 68), entry('2026-11-01', 67)],
      entry('2026-11-03', 68.4),
    );
    expect(list.map((e) => [e.dateKey, e.kg])).toEqual([
      ['2026-11-01', 67],
      ['2026-11-03', 68.4],
    ]);
    expect(latestWeight(list)?.kg).toBe(68.4);
  });

  it('computes change since a date, or null with too little data', () => {
    const list = [entry('2026-10-01', 67), entry('2026-10-20', 67.8), entry('2026-11-01', 68.5)];
    expect(weightChange(list, '2026-10-01')).toBe(1.5);
    expect(weightChange(list, '2026-10-15')).toBe(0.7);
    expect(weightChange(list, '2026-11-01')).toBeNull();
  });

  it('computes BMI and distance to target', () => {
    expect(bmi(68.5, 175)).toBe(22.4);
    expect(kgToTarget(profile.profile)).toBe(3.5);
  });
});

describe('profileService (mock database)', () => {
  it('saves a validated profile and persists it to the database', async () => {
    const saved = await profileService.saveProfile({
      ...profile.profile,
      goal: 'fat_loss',
      targetKg: 64,
    });
    expect(saved.profile.goal).toBe('fat_loss');
    expect(useMockDb.getState().profile.profile.targetKg).toBe(64);
    expect((await profileService.getProfile()).profile.goal).toBe('fat_loss');
  });

  it('a changed weight in the profile also lands in the weight log (once per day)', async () => {
    await profileService.updateProfile({ weightKg: 80 });
    await profileService.updateProfile({ weightKg: 79.5 });
    const today = (await profileService.getWeights()).filter((w) => w.kg === 79.5);
    expect(today).toHaveLength(1);
    expect(latestWeight(await profileService.getWeights())?.kg).toBe(79.5);
    // Unrelated changes don't add weigh-ins.
    const count = (await profileService.getWeights()).length;
    await profileService.updateProfile({ goal: 'athletic' });
    expect((await profileService.getWeights()).length).toBe(count);
  });

  it('rejects invalid updates without touching stored data', async () => {
    await expect(profileService.updateProfile({ heightCm: 50 })).rejects.toBeInstanceOf(
      ProfileValidationError,
    );
    expect(useMockDb.getState().profile.profile.heightCm).toBe(175);
  });

  it('logging a weight updates the log and current mass', async () => {
    const weights = await profileService.logWeight({ kg: 69.1 }, new Date(2026, 10, 4).getTime());
    expect(latestWeight(weights)?.kg).toBe(69.1);
    expect(useMockDb.getState().profile.profile.weightKg).toBe(69.1);
    const again = await profileService.logWeight({ kg: 69.0 }, new Date(2026, 10, 4, 20).getTime());
    expect(again.filter((w) => w.dateKey === '2026-11-04')).toHaveLength(1);
  });
});

describe('seed', () => {
  it('builds an unbroken 14-day streak of sample activity', () => {
    const seed = buildSeed(new Date(2026, 10, 4, 12).getTime());
    expect(seed.workouts.every((w) => w.source === 'sample')).toBe(true);
    expect(seed.weights.at(-1)?.kg).toBe(68.5);
  });
});
