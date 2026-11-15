import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { RoutineEditorScreen } from '@/features/workouts/screens/RoutineEditorScreen';
import { EXERCISE_CATALOG, WORKOUT_PLANS } from '@/features/workouts/services/catalog.mock';
import { workoutService } from '@/features/workouts/services/workout.service';
import type { Routine } from '@/features/workouts/types/workout-record.types';
import { buildSessionFromPlan } from '@/features/workouts/utils/workout-history.logic';
import { resetMockDb, useMockDb } from '@/services/mock-db/mock-db';
import { buildSeed } from '@/services/mock-db/seed';

const mockBack = jest.fn();
const mockPush = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, canGoBack: () => true }),
  useLocalSearchParams: () => mockParams,
}));

const NOW = new Date('2026-11-04T12:00:00').getTime();
const routine = (over: Partial<Routine> = {}): Routine => ({
  id: 'routine-1',
  name: 'Push A',
  exercises: [
    { exerciseId: 'bench-press', sets: 4 },
    { exerciseId: 'lateral-raise', sets: 3 },
  ],
  createdAt: NOW,
  updatedAt: NOW,
  ...over,
});

const renderEditor = async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <RoutineEditorScreen />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  resetMockDb(buildSeed(NOW));
});

describe('routines in the workout service', () => {
  it('lists a saved routine as a plan under the Custom category, after the built-in plans', async () => {
    await workoutService.saveRoutine(routine());
    const plans = await workoutService.getPlans();
    expect(plans.slice(0, WORKOUT_PLANS.length).map((p) => p.id)).toEqual(
      WORKOUT_PLANS.map((p) => p.id),
    );
    expect(plans.at(-1)).toMatchObject({ id: 'routine-1', name: 'Push A', categoryId: 'custom' });
    expect((await workoutService.getRoutines()).map((r) => r.id)).toEqual(['routine-1']);
  });

  it('replaces a routine saved again under the same id and deletes by id', async () => {
    await workoutService.saveRoutine(routine());
    await workoutService.saveRoutine(routine({ name: 'Push A v2', updatedAt: NOW + 1 }));
    expect((await workoutService.getRoutines()).map((r) => r.name)).toEqual(['Push A v2']);
    await workoutService.deleteRoutine('routine-1');
    expect(await workoutService.getRoutines()).toEqual([]);
  });

  it('adds the user’s own exercises to the library', async () => {
    const custom = { ...EXERCISE_CATALOG[0]!, id: 'custom-1', name: 'Sled Push' };
    await workoutService.saveCustomExercise(custom);
    const all = await workoutService.getExercises();
    expect(all).toHaveLength(EXERCISE_CATALOG.length + 1);
    expect(all.at(-1)!.name).toBe('Sled Push');
    await workoutService.deleteCustomExercise('custom-1');
    expect(await workoutService.getExercises()).toHaveLength(EXERCISE_CATALOG.length);
  });

  it('builds a session from a routine, skipping exercises that no longer exist', () => {
    const plan = {
      id: 'routine-1',
      name: 'Mixed',
      categoryId: 'custom',
      focus: '',
      exercises: [
        { exerciseId: 'deleted-exercise', sets: 3 },
        { exerciseId: 'bench-press', sets: 2 },
      ],
    };
    const session = buildSessionFromPlan(plan, EXERCISE_CATALOG, [], NOW);
    expect(session.exercises.map((e) => e.id)).toEqual(['bench-press']);
    // The first remaining exercise starts with an active set, even though it was second in the routine.
    expect(session.exercises[0]!.sets[0]!.status).toBe('active');
  });
});

describe('RoutineEditorScreen', () => {
  const addByName = async (name: string) => {
    await fireEvent.changeText(screen.getByLabelText('Search'), name);
    await fireEvent.press(await screen.findByRole('checkbox', { name }));
  };

  it('builds a new routine: name, exercises from the library, sets, order, save', async () => {
    await renderEditor();
    await fireEvent.changeText(await screen.findByLabelText('Routine name'), '  Upper A ');
    await fireEvent.press(screen.getByRole('button', { name: 'Add exercises' }));
    await addByName('Barbell Bench Press');
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Barbell Bench Press' })); // untick
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Barbell Bench Press' })); // tick again
    await fireEvent.changeText(screen.getByLabelText('Search'), 'Lateral');
    await fireEvent.press(await screen.findByRole('checkbox', { name: 'Lateral Raise' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add 2 exercises' }));

    expect(await screen.findByText('Exercises (2)')).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'More sets for Barbell Bench Press' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Move Lateral Raise up' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save routine' }));

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    const [saved] = useMockDb.getState().routines;
    expect(saved).toMatchObject({ name: 'Upper A' });
    expect(saved!.exercises).toEqual([
      { exerciseId: 'lateral-raise', sets: 3 },
      { exerciseId: 'bench-press', sets: 4 },
    ]);
    expect(saved!.id).toMatch(/^routine-/);
  });

  it('asks for a name and at least one exercise before saving', async () => {
    await renderEditor();
    await fireEvent.press(await screen.findByRole('button', { name: 'Save routine' }));
    expect(await screen.findByText('Give your routine a name')).toBeTruthy();
    expect(screen.getByText('Add at least one exercise')).toBeTruthy();
    expect(useMockDb.getState().routines).toHaveLength(0);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('greys out exercises already in the routine', async () => {
    mockParams = { id: 'routine-1' };
    await workoutService.saveRoutine(routine());
    await renderEditor();
    await fireEvent.press(await screen.findByRole('button', { name: 'Add exercises' }));
    await fireEvent.changeText(screen.getByLabelText('Search'), 'Barbell Bench');
    const row = await screen.findByRole('checkbox', { name: 'Barbell Bench Press' });
    expect(row.props.accessibilityState).toMatchObject({ checked: true, disabled: true });
    expect(screen.getByText(/Already added/)).toBeTruthy();
  });

  it('edits an existing routine in place, keeping its id and creation time', async () => {
    mockParams = { id: 'routine-1' };
    await workoutService.saveRoutine(routine());
    await renderEditor();
    const name = await screen.findByLabelText('Routine name');
    expect(name.props.value).toBe('Push A');
    await fireEvent.changeText(name, 'Push A+');
    await fireEvent.press(screen.getByRole('button', { name: 'Remove Lateral Raise' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save routine' }));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    const routines = useMockDb.getState().routines;
    expect(routines).toHaveLength(1);
    expect(routines[0]).toMatchObject({ id: 'routine-1', name: 'Push A+', createdAt: NOW });
    expect(routines[0]!.exercises).toEqual([{ exerciseId: 'bench-press', sets: 4 }]);
    expect(routines[0]!.updatedAt).toBeGreaterThan(NOW);
  });

  it('deletes a routine after confirming', async () => {
    mockParams = { id: 'routine-1' };
    await workoutService.saveRoutine(routine());
    await renderEditor();
    await fireEvent.press(await screen.findByText('Delete routine'));
    expect(screen.getByText('Delete this routine?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(useMockDb.getState().routines).toHaveLength(0);
  });

  it('says so when a routine cannot be found', async () => {
    mockParams = { id: 'nope' };
    await renderEditor();
    expect(await screen.findByText('Routine not found')).toBeTruthy();
  });

  it('creates a custom exercise from the picker, ticks it, and uses it in the routine', async () => {
    await renderEditor();
    await fireEvent.changeText(await screen.findByLabelText('Routine name'), 'Mine');
    await fireEvent.press(screen.getByRole('button', { name: 'Add exercises' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Create your own exercise' }));

    const sheet = await screen.findByText('New exercise');
    expect(sheet).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Save exercise' }));
    expect(await screen.findByText('Name your exercise')).toBeTruthy();
    expect(screen.getByText('Pick the main muscle group')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Name'), 'Sled Push');
    // The picker's filter chips share these names; the form is rendered last.
    await fireEvent.press(screen.getAllByRole('button', { name: 'Shoulders' }).at(-1)!);
    await fireEvent.press(screen.getByRole('button', { name: 'Barbell' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save exercise' }));
    await waitFor(() => expect(useMockDb.getState().customExercises).toHaveLength(1));
    expect(useMockDb.getState().customExercises[0]).toMatchObject({
      name: 'Sled Push',
      muscleGroup: 'shoulders',
    });

    await fireEvent.press(await screen.findByRole('button', { name: 'Add 1 exercise' }));
    const row = await screen.findByText('Sled Push');
    expect(within(row.parent!.parent!).getByText('Shoulders')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Save routine' }));
    await waitFor(() => expect(useMockDb.getState().routines).toHaveLength(1));
    expect(useMockDb.getState().routines[0]!.exercises[0]!.exerciseId).toMatch(/^custom-/);
  });

  it('refuses a duplicate exercise name', async () => {
    await renderEditor();
    await fireEvent.press(await screen.findByRole('button', { name: 'Add exercises' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Create your own exercise' }));
    await fireEvent.changeText(await screen.findByLabelText('Name'), 'barbell bench press');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Chest' }).at(-1)!);
    await fireEvent.press(screen.getByRole('button', { name: 'Barbell' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save exercise' }));
    expect(await screen.findByText('An exercise with this name already exists')).toBeTruthy();
    expect(useMockDb.getState().customExercises).toHaveLength(0);
  });
});
