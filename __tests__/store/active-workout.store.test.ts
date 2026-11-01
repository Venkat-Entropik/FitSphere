import { buildMockSession } from '@/features/workouts/services/workout.mock';
import {
  activeSet,
  currentExercise,
  DEFAULT_REST_SECONDS,
} from '@/features/workouts/utils/workout.logic';
import { useActiveWorkoutStore } from '@/store/active-workout.store';

const NOW = 1_000_000;

describe('active workout store', () => {
  beforeEach(() => useActiveWorkoutStore.setState({ session: null, rest: null }));

  it('starts a session and seeds the rest timer from the template', () => {
    useActiveWorkoutStore.getState().start(buildMockSession(NOW), NOW);
    const { session, rest } = useActiveWorkoutStore.getState();
    expect(session?.title).toContain('Push Day');
    expect(rest).toEqual({ totalSeconds: 105, endsAt: NOW + 78_000 });
  });

  it('adjusts weight and reps by the stepper amounts', () => {
    const store = useActiveWorkoutStore.getState();
    store.start(buildMockSession(NOW), NOW);
    store.adjustWeight(1);
    store.adjustReps(-1);
    const set = activeSet(currentExercise(useActiveWorkoutStore.getState().session!)!);
    expect(set).toMatchObject({ kg: 34.5, reps: 7 });
  });

  it('logging a set starts the default rest; add and skip update it', () => {
    const store = useActiveWorkoutStore.getState();
    store.start(buildMockSession(NOW), NOW);
    store.logSet(NOW);
    expect(useActiveWorkoutStore.getState().rest).toEqual({
      totalSeconds: DEFAULT_REST_SECONDS,
      endsAt: NOW + DEFAULT_REST_SECONDS * 1000,
    });
    store.addRest(30);
    expect(useActiveWorkoutStore.getState().rest).toEqual({
      totalSeconds: DEFAULT_REST_SECONDS + 30,
      endsAt: NOW + (DEFAULT_REST_SECONDS + 30) * 1000,
    });
    store.skipRest();
    expect(useActiveWorkoutStore.getState().rest).toBeNull();
  });

  it('finish clears the session', () => {
    const store = useActiveWorkoutStore.getState();
    store.start(buildMockSession(NOW), NOW);
    store.finish();
    expect(useActiveWorkoutStore.getState().session).toBeNull();
  });
});
