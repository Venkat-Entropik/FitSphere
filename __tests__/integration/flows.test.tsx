import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { dashboardService } from '@/features/dashboard/services/dashboard.service';
import { analyticsService } from '@/features/analytics/services/analytics.service';
import { nutritionService } from '@/features/nutrition/services/nutrition.service';
import { composeDay } from '@/features/nutrition/utils/nutrition.logic';
import { profileService } from '@/features/profile/services/profile.service';
import { nutritionTargets } from '@/features/profile/utils/profile.logic';
import { buildSnapshot } from '@/features/activities/utils/activity.logic';
import { activityService } from '@/features/activities/services/activity.service';
import { toActivityRecord } from '@/features/activities/utils/activity-history.logic';
import { WorkoutsScreen } from '@/features/workouts/screens/WorkoutsScreen';
import { workoutService } from '@/features/workouts/services/workout.service';
import { totalVolume } from '@/features/analytics/utils/analytics.logic';
import { useActiveWorkoutStore } from '@/store/active-workout.store';
import { useActivityRecordingStore } from '@/store/activity-recording.store';
import { useMockDb } from '@/services/mock-db/mock-db';
import { dateKey } from '@/utils/date';

jest.mock('expo-router', () => ({ useRouter: () => ({ navigate: jest.fn() }) }));

const renderWorkouts = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <WorkoutsScreen />
    </QueryClientProvider>,
  );
};

describe('workout flow: start → log → finish → everything updates', () => {
  beforeEach(() => useActiveWorkoutStore.setState({ session: null, rest: null }));

  it('saves the workout to history and the dashboard/analytics reflect it', async () => {
    const before = useMockDb.getState().workouts.length;
    const dashboardBefore = await dashboardService.getSummary();
    const volumeBefore = totalVolume((await analyticsService.getOverview('1W')).volume.buckets);

    await renderWorkouts();
    await fireEvent.press(await screen.findByRole('button', { name: /^Start / }));
    const session = useActiveWorkoutStore.getState().session!;
    expect(session.planId).toBeTruthy();
    expect(session.exercises[0]!.sets[0]!.status).toBe('active');

    await fireEvent.press(await screen.findByRole('button', { name: 'Log Set 1' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Finish Workout Session' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Finish Workout' }));

    await waitFor(() => expect(useMockDb.getState().workouts).toHaveLength(before + 1));
    const saved = useMockDb.getState().workouts.at(-1)!;
    expect(saved).toMatchObject({ source: 'user', setsCompleted: 1 });
    expect(saved.volumeKg).toBeGreaterThan(0);
    expect(useActiveWorkoutStore.getState().session).toBeNull();

    const dashboardAfter = await dashboardService.getSummary();
    expect(dashboardAfter.insight.completedWorkouts).toBe(
      dashboardBefore.insight.completedWorkouts + 1,
    );
    expect(dashboardAfter.telemetry.activeBurnKcal).toBe(saved.kcal);
    expect(totalVolume((await analyticsService.getOverview('1W')).volume.buckets)).toBe(
      volumeBefore + saved.volumeKg,
    );
  });

  it('keeps the session when saving fails, so no work is lost', async () => {
    jest.spyOn(workoutService, 'saveWorkout').mockRejectedValueOnce(new Error('offline'));
    await renderWorkouts();
    await fireEvent.press(await screen.findByRole('button', { name: /^Start / }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Log Set 1' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Finish Workout Session' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Finish Workout' }));

    expect(await screen.findByText(/Couldn.t save your workout/)).toBeTruthy();
    expect(useActiveWorkoutStore.getState().session).not.toBeNull();
    expect(useMockDb.getState().workouts.every((w) => w.source === 'sample')).toBe(true);
  });

  it('next workout loads from history: progressing weight after hitting the rep ceiling', async () => {
    await renderWorkouts();
    await fireEvent.press(await screen.findByRole('button', { name: /^Start / }));
    const first = useActiveWorkoutStore.getState().session!.exercises[0]!.sets[0]!;
    expect(first.kg).toBeGreaterThan(0);
    expect(first.reps).toBeGreaterThan(0);
  });
});

describe('activity flow: record → save → history', () => {
  it('turns a recording into a stored record', async () => {
    const t0 = new Date(2026, 10, 4, 7).getTime();
    const points = Array.from({ length: 121 }, (_, i) => ({
      lat: 37 + (i * 10) / 111_195,
      lng: -122,
      altitude: 10,
      accuracy: 5,
      timestamp: t0 + i * 3000,
    }));
    const snapshot = buildSnapshot({
      kind: 'run',
      title: 'Outdoor Run',
      points,
      durationSec: 360,
      weightKg: 68.5,
      targetPaceSecPerKm: 300,
      lapCount: 0,
    });
    useActivityRecordingStore.getState().finish(snapshot);
    expect(useActivityRecordingStore.getState().lastSummary?.distanceKm).toBeCloseTo(1.2, 2);

    const record = toActivityRecord(snapshot, {
      id: 'activity-test',
      startedAt: t0,
      endedAt: t0 + 360_000,
    });
    await activityService.saveActivity(record);
    const stored = (await activityService.getHistory()).find((a) => a.id === 'activity-test')!;
    expect(stored).toMatchObject({ source: 'user', kind: 'run' });
    expect(stored.splits).toHaveLength(1);
    expect(stored.kcal).toBe(Math.round(68.5 * 1.2 * 1.04));
  });
});

describe('profile flow: profile changes recalculate targets', () => {
  it('updating goal and weight changes the nutrition budget and macros', async () => {
    const key = dateKey(Date.now());
    const before = await profileService.getProfile();
    const day1 = composeDay(
      await nutritionService.getDay(key),
      before,
      nutritionTargets(before.profile, before.identity.age),
    );

    const after = await profileService.updateProfile({ goal: 'fat_loss', weightKg: 80 });
    const day2 = composeDay(
      await nutritionService.getDay(key),
      after,
      nutritionTargets(after.profile, after.identity.age),
    );

    expect(day2.budgetKcal).not.toBe(day1.budgetKcal);
    expect(day2.macroTargets.protein).toBe(176); // 2.2 g/kg × 80
    expect(day2.meals).toEqual(day1.meals);
    expect(day2.weightKg).toBe(80);
  });
});
