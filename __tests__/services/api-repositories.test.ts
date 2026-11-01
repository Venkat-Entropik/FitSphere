import { QueryClient } from '@tanstack/react-query';

import { env } from '@/config/env';
import { analyticsService } from '@/features/analytics/services/analytics.service';
import { startSession } from '@/features/authentication/services/session';
import { dashboardService } from '@/features/dashboard/services/dashboard.service';
import { nutritionService } from '@/features/nutrition/services/nutrition.service';
import { profileService } from '@/features/profile/services/profile.service';
import { progressService } from '@/features/progress/services/progress.service';
import { EXERCISE_CATALOG, WORKOUT_PLANS } from '@/features/workouts/services/catalog.mock';
import { workoutService } from '@/features/workouts/services/workout.service';
import { apiClient } from '@/services/api/api-client';
import { useMockDb } from '@/services/mock-db/mock-db';
import { buildSeed } from '@/services/mock-db/seed';
import { usePreferencesStore } from '@/store/preferences.store';
import { buildOverview } from '@/features/analytics/utils/analytics.aggregate';
import { buildDashboard } from '@/features/dashboard/utils/dashboard.aggregate';
import { buildProgress } from '@/features/progress/utils/progress.aggregate';

// These tests run the real (API) repositories, so the mock backend is switched off.
jest.mock('@/config/env', () => ({
  env: { useMocks: false, apiUrl: 'http://api.test.local', apiTimeoutMs: 1000 },
}));

jest.mock('@/services/api/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const client = apiClient as jest.Mocked<typeof apiClient>;
const NOW = new Date('2026-11-01T12:00:00').getTime();
const seed = buildSeed(NOW);
const withWeights = { ...seed.profile };

function serve(profileOverrides: object = {}) {
  client.get.mockImplementation(async (url: string) => {
    switch (url) {
      case '/profile':
        return { data: { ...withWeights, ...profileOverrides } };
      case '/profile/weights':
        return { data: seed.weights };
      case '/workouts/history':
        return { data: seed.workouts };
      case '/activities':
        return { data: seed.activities };
      default:
        throw new Error(`Unexpected GET ${url}`);
    }
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
  serve();
});
afterEach(() => jest.restoreAllMocks());

describe('API-mode configuration', () => {
  it('is running against the real repositories', () => {
    expect(env.useMocks).toBe(false);
  });
});

describe('raw records are aggregated on the client', () => {
  it('builds the dashboard from fetched records with the shared aggregator', async () => {
    const summary = await dashboardService.getSummary();
    expect(summary).toEqual(
      buildDashboard({
        now: NOW,
        profile: seed.profile,
        workouts: seed.workouts,
        activities: seed.activities,
        plans: WORKOUT_PLANS,
      }),
    );
    expect(client.get.mock.calls.map((c) => c[0]).sort()).toEqual([
      '/activities',
      '/profile',
      '/profile/weights',
      '/workouts/history',
    ]);
  });

  it('builds analytics for the requested range', async () => {
    const overview = await analyticsService.getOverview('1M');
    expect(overview).toEqual(
      buildOverview({
        range: '1M',
        now: NOW,
        profile: seed.profile,
        workouts: seed.workouts,
        activities: seed.activities,
        weights: seed.weights,
        plans: WORKOUT_PLANS,
      }),
    );
  });

  it('builds progress', async () => {
    expect(await progressService.getOverview()).toEqual(
      buildProgress({
        now: NOW,
        profile: seed.profile,
        workouts: seed.workouts,
        activities: seed.activities,
        weights: seed.weights,
      }),
    );
  });

  it('never asks the server for finished aggregates', async () => {
    await dashboardService.getSummary();
    await progressService.getOverview();
    const urls = client.get.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => /dashboard|analytics|progress$/.test(u))).toBe(false);
  });
});

describe('workouts', () => {
  it('serves exercises, plans and categories from bundled reference data', async () => {
    expect(await workoutService.getExercises()).toBe(EXERCISE_CATALOG);
    expect(await workoutService.getPlans()).toBe(WORKOUT_PLANS);
    expect((await workoutService.getCategories()).length).toBeGreaterThan(0);
    expect(client.get).not.toHaveBeenCalled();
  });

  it('reads history and saves records through the API', async () => {
    expect(await workoutService.getHistory()).toBe(seed.workouts);
    const record = seed.workouts[0]!;
    client.post.mockResolvedValue({ data: record });
    await workoutService.saveWorkout(record);
    expect(client.post).toHaveBeenCalledWith('/workouts', record);
  });
});

describe('write payloads', () => {
  it('sends a client id and day with a weigh-in so retries replace it', async () => {
    client.post.mockResolvedValue({ data: [] });
    await profileService.logWeight({ kg: 70.2, bodyFatPercent: 14 }, NOW);
    expect(client.post).toHaveBeenCalledWith('/profile/weights', {
      id: `weight-${NOW}`,
      dateKey: '2026-11-01',
      kg: 70.2,
      bodyFatPercent: 14,
    });
  });

  it('sends a client id and time with a logged meal', async () => {
    client.post.mockResolvedValue({ data: { dateKey: '2026-11-01', meals: [], hydrationMl: 0 } });
    await nutritionService.logMeal(
      '2026-11-01',
      { category: 'lunch', title: 'Bowl', kcal: 600, protein: 40, carbs: 60, fat: 15 },
      NOW,
    );
    expect(client.post).toHaveBeenCalledWith(
      '/nutrition/foods',
      expect.objectContaining({
        date: '2026-11-01',
        id: `meal-${NOW}`,
        loggedAt: NOW,
        title: 'Bowl',
      }),
    );
  });
});

describe('startSession with the real backend', () => {
  const session = (id: string) => ({
    user: { id, name: 'Sam Lee', email: `${id}@example.com` },
    tokens: { accessToken: `a-${id}`, refreshToken: `r-${id}`, expiresIn: 900 },
  });

  beforeEach(() => {
    usePreferencesStore.setState({
      lastUserId: null,
      onboardingComplete: false,
      onboardingSkipped: false,
    });
  });

  it("takes onboarding completion from the account's server profile", async () => {
    serve({ onboardingComplete: true });
    await startSession(session('u1'), new QueryClient());
    expect(usePreferencesStore.getState().onboardingComplete).toBe(true);
  });

  it('keeps onboarding pending for an account that has not finished it', async () => {
    serve({ onboardingComplete: false });
    await startSession(session('u2'), new QueryClient());
    expect(usePreferencesStore.getState().onboardingComplete).toBe(false);
  });

  it('does not reset or touch the on-device sample data', async () => {
    useMockDb.setState((s) => ({
      profile: { ...s.profile, profile: { ...s.profile.profile, weightKg: 123 } },
    }));
    usePreferencesStore.setState({ lastUserId: 'old' });
    await startSession(session('u3'), new QueryClient());
    expect(useMockDb.getState().profile.profile.weightKg).toBe(123);
  });

  it('still signs in when the profile cannot be fetched', async () => {
    client.get.mockRejectedValue(new Error('offline'));
    await expect(startSession(session('u4'), new QueryClient())).resolves.toBeUndefined();
  });
});
