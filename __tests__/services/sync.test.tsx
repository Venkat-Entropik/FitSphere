import { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { dashboardService } from '@/features/dashboard/services/dashboard.service';
import { buildDashboard } from '@/features/dashboard/utils/dashboard.aggregate';
import { nutritionService } from '@/features/nutrition/services/nutrition.service';
import { profileService } from '@/features/profile/services/profile.service';
import { startSession } from '@/features/authentication/services/session';
import { SyncSheet } from '@/features/sync/components/SyncSheet';
import { SyncStatusPill } from '@/features/sync/components/SyncStatusPill';
import { WORKOUT_PLANS } from '@/features/workouts/services/catalog.mock';
import { workoutService } from '@/features/workouts/services/workout.service';
import { apiClient } from '@/services/api/api-client';
import { ApiError } from '@/services/api/api-error';
import { resetMockDb, useMockDb } from '@/services/mock-db/mock-db';
import { buildSeed } from '@/services/mock-db/seed';
import {
  discardChange,
  emptyLocalData,
  resetSyncRuntime,
  startSync,
  syncNow,
  useOutbox,
  useSyncStatusStore,
} from '@/services/sync';
import { useAuthStore } from '@/store/auth.store';
import { usePreferencesStore } from '@/store/preferences.store';

// Sync only runs against the real backend, so the offline demo (mocks) is switched off here.
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
const NOW = new Date('2026-11-04T12:00:00').getTime();
const MEAL = {
  category: 'lunch',
  title: 'Chicken bowl',
  kcal: 600,
  protein: 45,
  carbs: 60,
  fat: 15,
} as const;

const offline = () => new ApiError('No connection.', 'network');
const refused = () => new ApiError('Refused.', 'validation', 400);
const expired = () => new ApiError('Expired.', 'unauthorized', 401);

const signIn = (id: string, name = 'Sam') =>
  useAuthStore.setState({ status: 'signedIn', user: { id, name, email: `${id}@example.com` } });

/** What the server returns for the three reads a catch-up makes. */
function serveSeed(overrides: { onboardingComplete?: boolean } = {}) {
  const seed = buildSeed(NOW);
  client.get.mockImplementation(async (url: string) => {
    switch (url) {
      case '/profile':
        return {
          data: { ...seed.profile, onboardingComplete: overrides.onboardingComplete ?? true },
        };
      case '/profile/weights':
        return { data: seed.weights };
      case '/workouts/history':
        return { data: seed.workouts };
      case '/activities':
        return { data: seed.activities };
      case '/nutrition/range':
        return { data: Object.values(seed.nutritionDays) };
      case '/routines':
      case '/exercises/custom':
        return { data: [] };
      default:
        throw new Error(`Unexpected GET ${url}`);
    }
  });
  return seed;
}

const serverEmpty = () =>
  client.get.mockImplementation(async (url: string) => {
    if (url === '/profile')
      return { data: { ...emptyLocalData('Sam').profile, onboardingComplete: true } };
    if (url === '/nutrition/range') return { data: [] };
    return { data: [] };
  });

const pending = () => useOutbox.getState().items.filter((i) => i.status === 'pending');
const failed = () => useOutbox.getState().items.filter((i) => i.status === 'failed');
const today = () => new Date().toISOString().slice(0, 10);

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  resetSyncRuntime();
  useOutbox.setState({ items: [] });
  useAuthStore.setState({ status: 'signedOut', user: null });
  signIn('u1');
  resetMockDb({ ...emptyLocalData('Sam'), ownerId: 'u1' });
  usePreferencesStore.setState({ onboardingComplete: false, lastUserId: 'u1' });
  for (const method of ['post', 'put', 'patch', 'delete'] as const) {
    client[method].mockResolvedValue({ data: {} });
  }
  serverEmpty();
});

afterEach(() => resetSyncRuntime());

describe('working offline', () => {
  it('shows a logged meal at once and keeps it queued while the server is unreachable', async () => {
    client.post.mockRejectedValue(offline());
    const day = await nutritionService.logMeal('2026-11-04', MEAL, NOW);
    expect(day.meals.map((m) => m.title)).toEqual(['Chicken bowl']);
    await syncNow('write');
    expect(pending()).toHaveLength(1);
    expect(useSyncStatusStore.getState().unreachable).toBe('network');
    // The screen reads the same local data, so the meal is still there.
    expect((await nutritionService.getDay('2026-11-04')).meals).toHaveLength(1);
  });

  it('sends everything in order once the connection is back, then empties the queue', async () => {
    client.post.mockRejectedValue(offline());
    await nutritionService.logMeal('2026-11-04', MEAL, NOW);
    await nutritionService.logMeal(
      '2026-11-04',
      { ...MEAL, title: 'Dinner', category: 'dinner' },
      NOW + 1,
    );
    await nutritionService.addWater('2026-11-04', 500, 3500);
    await syncNow('manual');
    expect(pending()).toHaveLength(3);

    client.post.mockClear();
    client.post.mockResolvedValue({ data: {} });
    await syncNow('manual');
    expect(pending()).toHaveLength(0);
    expect(client.post.mock.calls.map((c) => c[0])).toEqual([
      '/nutrition/foods',
      '/nutrition/foods',
      '/nutrition/water',
    ]);
    expect(client.post.mock.calls[0]![1]).toMatchObject({
      date: '2026-11-04',
      id: `meal-${NOW}`,
      loggedAt: NOW,
      title: 'Chicken bowl',
    });
    expect(client.post.mock.calls[1]![1]).toMatchObject({ id: `meal-${NOW + 1}`, title: 'Dinner' });
    expect(useSyncStatusStore.getState().unreachable).toBeNull();
    expect(useSyncStatusStore.getState().lastSyncedAt).not.toBeNull();
  });

  it('recovers by itself when the server comes back, even though the phone never reported being offline', async () => {
    client.post.mockRejectedValue(offline());
    await nutritionService.addWater('2026-11-04', 250, 3500);
    await syncNow('write');
    expect(pending()).toHaveLength(1);
    expect(useSyncStatusStore.getState().online).toBe(true);

    client.post.mockResolvedValue({ data: {} });
    await syncNow('timer'); // what the retry timer does
    expect(pending()).toHaveLength(0);
    expect(useSyncStatusStore.getState().unreachable).toBeNull();
  });

  it('does not call the server at all while the phone knows it is offline, and sends on reconnect', async () => {
    useSyncStatusStore.getState().set({ online: false });
    await workoutService.saveWorkout({
      id: 'w1',
      planId: null,
      title: 'Push',
      startedAt: NOW,
      endedAt: NOW + 1,
      durationSec: 1,
      volumeKg: 0,
      setsCompleted: 0,
      prCount: 0,
      kcal: 1,
      exercises: [],
      source: 'user',
    });
    await syncNow('write');
    expect(client.post).not.toHaveBeenCalled();
    expect(pending()).toHaveLength(1);
    expect((await workoutService.getHistory()).map((w) => w.id)).toContain('w1');

    useSyncStatusStore.getState().set({ online: true });
    await syncNow('reconnect');
    expect(client.post).toHaveBeenCalledWith('/workouts', expect.objectContaining({ id: 'w1' }));
    expect(pending()).toHaveLength(0);
  });

  it('retries a water tap with the same event id, so it is never counted twice', async () => {
    client.post.mockRejectedValueOnce(offline());
    await nutritionService.addWater('2026-11-04', 250, 3500);
    await syncNow('manual');
    await syncNow('manual');
    const ids = client.post.mock.calls.map((c) => (c[1] as { id: string }).id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(ids[1]);
    expect(ids[0]).toMatch(/^water-/);
    expect(pending()).toHaveLength(0);
  });

  it('keeps a profile edit and weigh-in locally and sends them as idempotent requests', async () => {
    client.post.mockRejectedValue(offline());
    client.patch.mockRejectedValue(offline());
    const profile = await profileService.updateProfile({ targetKg: 75 });
    expect(profile.profile.targetKg).toBe(75);
    await profileService.logWeight({ kg: 71.5 }, NOW);
    expect(useMockDb.getState().profile.profile.weightKg).toBe(71.5);
    client.post.mockResolvedValue({ data: {} });
    client.patch.mockResolvedValue({ data: {} });
    await syncNow('manual');
    expect(client.patch).toHaveBeenCalledWith('/profile', { targetKg: 75 });
    expect(client.post).toHaveBeenCalledWith('/profile/weights', {
      id: `weight-${NOW}`,
      dateKey: '2026-11-04',
      kg: 71.5,
    });
  });

  it('rejects impossible values before they are queued', async () => {
    await expect(profileService.logWeight({ kg: 5 }, NOW)).rejects.toThrow();
    expect(useOutbox.getState().items).toHaveLength(0);
  });
});

describe('routines and custom exercises sync', () => {
  const routine = {
    id: 'routine-1',
    name: 'Push A',
    exercises: [{ exerciseId: 'bench-press', sets: 4 }],
    createdAt: NOW,
    updatedAt: NOW,
  };

  it('keeps a routine created offline and sends it later', async () => {
    client.post.mockRejectedValue(offline());
    await workoutService.saveRoutine(routine);
    await syncNow('write');
    expect((await workoutService.getRoutines()).map((r) => r.name)).toEqual(['Push A']);
    expect(pending()).toHaveLength(1);

    client.post.mockResolvedValue({ data: {} });
    await syncNow('manual');
    expect(client.post).toHaveBeenCalledWith('/routines', routine);
    expect(pending()).toHaveLength(0);
  });

  it('sends only the fields the server stores for a custom exercise, and deletes by id', async () => {
    const exercise = {
      id: 'custom-1',
      name: 'Sled Push',
      muscleGroup: 'legs',
      muscles: 'Legs',
      equipment: 'machine',
      category: 'Legs · Custom',
      repRange: [8, 12],
      incrementKg: 5,
      startKg: 0,
      video: { youtubeId: 'aaaaaaaaaaa', title: 'ignored' },
      cues: ['ignored'],
    } as const;
    await workoutService.saveCustomExercise(exercise as never);
    await workoutService.deleteCustomExercise('custom-1');
    await workoutService.deleteRoutine('routine-1');
    await syncNow('manual');
    const sent = client.post.mock.calls.find((c) => c[0] === '/exercises/custom')![1] as Record<
      string,
      unknown
    >;
    expect(Object.keys(sent).sort()).toEqual(
      [
        'category',
        'equipment',
        'id',
        'incrementKg',
        'muscleGroup',
        'muscles',
        'name',
        'repRange',
        'startKg',
      ].sort(),
    );
    expect(client.delete).toHaveBeenCalledWith('/exercises/custom/custom-1');
    expect(client.delete).toHaveBeenCalledWith('/routines/routine-1');
  });

  it('brings routines and custom exercises from the account when catching up', async () => {
    const seed = serveSeed();
    void seed;
    client.get.mockImplementation(async (url: string) => {
      if (url === '/routines') return { data: [routine] };
      if (url === '/exercises/custom') return { data: [] };
      if (url === '/profile')
        return { data: { ...emptyLocalData('Sam').profile, onboardingComplete: true } };
      if (url === '/nutrition/range') return { data: [] };
      return { data: [] };
    });
    await syncNow('start');
    expect((await workoutService.getRoutines()).map((r) => r.id)).toEqual(['routine-1']);
    expect((await workoutService.getPlans()).at(-1)).toMatchObject({
      id: 'routine-1',
      categoryId: 'custom',
    });
  });
});

describe('when the server refuses or the session ends', () => {
  it('parks a refused change for the user and keeps sending the rest', async () => {
    client.post.mockRejectedValueOnce(refused()).mockResolvedValue({ data: {} });
    await nutritionService.logMeal('2026-11-04', MEAL, NOW);
    await nutritionService.addWater('2026-11-04', 250, 3500);
    await syncNow('manual');
    expect(failed().map((i) => i.change.type)).toEqual(['meal.log']);
    expect(pending()).toHaveLength(0);
    // Still visible locally until the user decides.
    expect((await nutritionService.getDay('2026-11-04')).meals).toHaveLength(1);
  });

  it('discarding a refused change reverts the screen to what the server has', async () => {
    client.post.mockRejectedValueOnce(refused());
    await nutritionService.logMeal('2026-11-04', MEAL, NOW);
    await syncNow('manual');
    discardChange(failed()[0]!.id);
    await syncNow('manual');
    expect(useOutbox.getState().items).toHaveLength(0);
    expect((await nutritionService.getDay('2026-11-04')).meals).toHaveLength(0);
  });

  it('keeps changes queued when the session has expired', async () => {
    client.post.mockRejectedValue(expired());
    await nutritionService.addWater('2026-11-04', 250, 3500);
    await syncNow('manual');
    expect(pending()).toHaveLength(1);
    expect(failed()).toHaveLength(0);
  });

  it('never sends one account’s changes while another is signed in', async () => {
    client.post.mockRejectedValue(offline());
    await nutritionService.addWater('2026-11-04', 250, 3500);
    expect(useOutbox.getState().items[0]!.userId).toBe('u1');

    client.post.mockClear();
    client.post.mockResolvedValue({ data: {} });
    signIn('u2');
    await syncNow('manual');
    expect(client.post).not.toHaveBeenCalled();
    expect(useOutbox.getState().items).toHaveLength(1);

    signIn('u1');
    await syncNow('manual');
    expect(client.post).toHaveBeenCalledTimes(1);
    expect(useOutbox.getState().items).toHaveLength(0);
  });
});

describe('catching up with the account', () => {
  it('replaces the local copy with the server data, so every screen reflects it', async () => {
    const seed = serveSeed();
    await syncNow('start');
    const db = useMockDb.getState();
    expect(db.workouts).toEqual(seed.workouts);
    expect(db.weights).toEqual(seed.weights);
    expect(db.ownerId).toBe('u1');
    expect(usePreferencesStore.getState().onboardingComplete).toBe(true);
    // The dashboard is computed from the local copy, offline or not.
    expect(await dashboardService.getSummary()).toEqual(
      buildDashboard({
        now: Date.now(),
        profile: seed.profile,
        workouts: seed.workouts,
        activities: seed.activities,
        plans: WORKOUT_PLANS,
      }),
    );
  });

  it('keeps changes the server has not confirmed on top of the fresh data', async () => {
    serveSeed();
    client.post.mockRejectedValueOnce(refused());
    await nutritionService.logMeal(today(), MEAL, NOW);
    await syncNow('manual');
    expect((await nutritionService.getDay(today())).meals.map((m) => m.title)).toContain(
      'Chicken bowl',
    );
  });

  it('does not touch the on-device data if the server cannot be reached', async () => {
    resetMockDb({ ...buildSeed(NOW), ownerId: 'u1' });
    client.get.mockRejectedValue(offline());
    await syncNow('start');
    expect(useMockDb.getState().workouts.length).toBeGreaterThan(0);
    expect(useSyncStatusStore.getState().unreachable).toBe('network');
  });

  it('replaces sample data that belongs to nobody when sync starts', async () => {
    resetMockDb(buildSeed(NOW)); // as left by an older version of the app
    serveSeed({ onboardingComplete: false });
    startSync(new QueryClient());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
      await syncNow('manual');
    });
    expect(useMockDb.getState().ownerId).toBe('u1');
  });
});

describe('signing in', () => {
  const session = (id: string) => ({
    user: { id, name: 'Sam Lee', email: `${id}@example.com` },
    tokens: { accessToken: `a-${id}`, refreshToken: `r-${id}`, expiresIn: 900 },
  });

  it('gives a new account a blank local copy named after them, then catches up', async () => {
    useAuthStore.setState({ status: 'signedOut', user: null });
    usePreferencesStore.setState({ lastUserId: 'someone-else', onboardingComplete: true });
    resetMockDb({ ...buildSeed(NOW), ownerId: 'someone-else' });
    serveSeed({ onboardingComplete: false });
    await startSession(session('u9'), new QueryClient());
    const db = useMockDb.getState();
    expect(db.ownerId).toBe('u9');
    expect(db.workouts).toEqual(buildSeed(NOW).workouts); // the server's data, not someone else's
    expect(usePreferencesStore.getState()).toMatchObject({
      lastUserId: 'u9',
      onboardingComplete: false,
    });
  });

  it('takes onboarding completion from the account', async () => {
    useAuthStore.setState({ status: 'signedOut', user: null });
    serveSeed({ onboardingComplete: true });
    await startSession(session('u1'), new QueryClient());
    expect(usePreferencesStore.getState().onboardingComplete).toBe(true);
  });

  it('still signs in when the server is slow or down', async () => {
    useAuthStore.setState({ status: 'signedOut', user: null });
    client.get.mockRejectedValue(offline());
    await expect(startSession(session('u1'), new QueryClient())).resolves.toBeUndefined();
    expect(useAuthStore.getState().status).toBe('signedIn');
  });
});

describe('the sync status in the app', () => {
  it('says Synced when nothing is waiting', async () => {
    await render(<SyncStatusPill />);
    expect(screen.getByRole('button', { name: /Sync status: Synced/ })).toBeTruthy();
  });

  it('says Offline with a count of changes waiting', async () => {
    useSyncStatusStore.getState().set({ online: false });
    client.post.mockRejectedValue(offline());
    await nutritionService.addWater('2026-11-04', 250, 3500);
    await nutritionService.logMeal('2026-11-04', MEAL, NOW);
    await render(<SyncStatusPill />);
    expect(screen.getByText('Offline · 2')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Offline, 2 changes waiting/ })).toBeTruthy();
  });

  it('says Waiting (not Offline) when the server is slow to answer', async () => {
    client.post.mockRejectedValue(new ApiError('Slow.', 'timeout'));
    await nutritionService.addWater('2026-11-04', 250, 3500);
    await syncNow('write');
    await render(<SyncStatusPill />);
    expect(screen.getByText('Waiting · 1')).toBeTruthy();
  });

  it('explains offline mode in plain words in the details sheet', async () => {
    useSyncStatusStore.getState().set({ online: false });
    await render(<SyncSheet visible onClose={jest.fn()} />);
    expect(screen.getByText("You're offline")).toBeTruthy();
    expect(screen.getByText(/saved on this phone and will sync automatically/)).toBeTruthy();
  });

  it('shows refused changes with Try again and Discard', async () => {
    client.post.mockRejectedValueOnce(refused());
    await nutritionService.logMeal('2026-11-04', MEAL, NOW);
    await syncNow('manual');
    await render(<SyncStatusPill />);
    expect(screen.getByText('Needs attention · 1')).toBeTruthy();

    await render(<SyncSheet visible onClose={jest.fn()} />);
    expect(screen.getByText('Meal: Chicken bowl')).toBeTruthy();
    client.post.mockResolvedValue({ data: {} });
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(useOutbox.getState().items).toHaveLength(0);
  });

  it('is hidden for the offline demo account', async () => {
    useAuthStore.setState({ status: 'signedIn', user: { id: 'demo', name: 'Demo', email: '' } });
    await render(<SyncStatusPill />);
    expect(screen.queryByRole('button', { name: /Sync status/ })).toBeNull();
  });
});
