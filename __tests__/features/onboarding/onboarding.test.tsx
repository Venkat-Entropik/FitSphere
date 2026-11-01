import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { OnboardingScreen } from '@/features/authentication/screens/OnboardingScreen';
import type { OnboardingProfile } from '@/features/authentication/types/onboarding.types';
import {
  activityFactor,
  cadenceSummary,
  formatDelta,
  recommendedGoal,
  recommendedSplit,
  restingKcal,
  synthesize,
  targetDelta,
} from '@/features/authentication/utils/onboarding.logic';
import {
  onboardingSchema,
  previewProfile,
  toFormValues,
  toProfile,
} from '@/features/authentication/utils/onboarding.schema';
import { usePreferencesStore } from '@/store/preferences.store';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn(), canGoBack: () => false }),
}));

const profile: OnboardingProfile = {
  goal: 'muscle',
  sex: 'male',
  heightCm: 175,
  weightKg: 68.5,
  targetKg: 72,
  experience: 'intermediate',
  daysPerWeek: 5,
};
const identity = { name: 'Alex', age: 28 };

describe('onboarding logic', () => {
  it('reproduces the reference synthesis: ~2,600 kcal, 140 g protein, PPL', () => {
    const s = synthesize(profile, identity);
    expect(s.baselineKcal).toBe(2600);
    expect(s.proteinG).toBe(140);
    expect(s.proteinPerKg).toBe(2.05);
    expect(s.split.code).toBe('PPL');
  });

  it('computes resting energy with Mifflin–St Jeor and scales with training days', () => {
    expect(restingKcal(profile, 28)).toBeCloseTo(1643.75, 2);
    expect(restingKcal({ ...profile, sex: 'female' }, 28)).toBeCloseTo(1477.75, 2);
    expect(activityFactor(0)).toBe(1.2);
    expect(activityFactor(5)).toBeCloseTo(1.575, 3);
    expect(activityFactor(99)).toBeCloseTo(1.725, 3);
  });

  it('recommends a goal from the weight direction', () => {
    expect(recommendedGoal(68.5, 72)).toBe('muscle');
    expect(recommendedGoal(80, 74)).toBe('fat_loss');
    expect(recommendedGoal(70, 70.5)).toBe('athletic');
  });

  it('picks a split and describes cadence against the goal range', () => {
    expect(recommendedSplit(2).code).toBe('FB');
    expect(recommendedSplit(4).code).toBe('U/L');
    expect(recommendedSplit(6).code).toBe('PPL×2');
    expect(cadenceSummary('muscle', 5)).toEqual({
      label: 'Hypertrophy Optimal',
      rest: '2 Rest & CNS Recovery',
    });
    expect(cadenceSummary('muscle', 2).label).toBe('Below ideal range');
    expect(cadenceSummary('athletic', 7).label).toBe('Above ideal range');
  });

  it('formats the target delta', () => {
    expect(formatDelta(targetDelta(profile))).toBe('+3.5kg');
    expect(formatDelta(-2)).toBe('-2kg');
  });
});

describe('onboarding schema', () => {
  const valid = toFormValues(profile);

  it('round-trips a valid profile', () => {
    const parsed = onboardingSchema.parse(valid);
    expect(toProfile(parsed)).toEqual(profile);
  });

  it.each([
    [{ heightCm: '' }, 'heightCm'],
    [{ heightCm: '90' }, 'heightCm'],
    [{ heightCm: 'abc' }, 'heightCm'],
    [{ weightKg: '400' }, 'weightKg'],
    [{ targetKg: '12' }, 'targetKg'],
    [{ daysPerWeek: 0 }, 'daysPerWeek'],
    [{ daysPerWeek: 8 }, 'daysPerWeek'],
    [{ goal: 'other' }, 'goal'],
  ])('rejects %p', (override, field) => {
    const result = onboardingSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((i) => i.path[0] === field)).toBe(true);
  });

  it('falls back to saved values while a field is blank or invalid mid-typing', () => {
    const live = previewProfile({ ...valid, weightKg: '', heightCm: '17.' }, profile);
    expect(live.weightKg).toBe(68.5);
    expect(live.heightCm).toBe(17);
  });
});

describe('OnboardingScreen', () => {
  const renderScreen = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    return render(
      <QueryClientProvider client={client}>
        <OnboardingScreen />
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    mockReplace.mockClear();
    usePreferencesStore.setState({ onboardingComplete: false });
  });

  it('shows the reference defaults and derived synthesis', async () => {
    await renderScreen();
    expect(await screen.findByText('Tailor Your Sphere.')).toBeTruthy();
    expect(
      screen.getByRole('radio', { name: 'Build Muscle' }).props.accessibilityState.checked,
    ).toBe(true);
    expect(screen.getByText('5 Days / Week')).toBeTruthy();
    expect(screen.getByText('~2,600')).toBeTruthy();
    expect(screen.getByText('+3.5kg')).toBeTruthy();
  });

  it('updates selections and live calculations', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByRole('radio', { name: 'Endurance & Speed' }));
    expect(
      screen.getByRole('radio', { name: 'Endurance & Speed' }).props.accessibilityState.checked,
    ).toBe(true);
    expect(
      screen.getByRole('radio', { name: 'Build Muscle' }).props.accessibilityState.checked,
    ).toBe(false);

    await fireEvent.press(screen.getByRole('button', { name: 'Train 3 days per week' }));
    expect(screen.getByText('3 Days / Week')).toBeTruthy();
    expect(screen.getByText('4 Rest & CNS Recovery')).toBeTruthy();

    await fireEvent.press(screen.getByRole('tab', { name: 'Advanced' }));
    expect(screen.getByText('5+ yrs')).toBeTruthy();
  });

  it('blocks submit and shows an error for an invalid height', async () => {
    await renderScreen();
    await fireEvent.changeText(await screen.findByLabelText('Height'), '90');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Complete Setup & Launch Dashboard' }),
    );
    expect(await screen.findByText('Height must be between 120 and 230')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(usePreferencesStore.getState().onboardingComplete).toBe(false);
  });

  it('saves, marks onboarding complete and opens the dashboard', async () => {
    await renderScreen();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Complete Setup & Launch Dashboard' }),
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(usePreferencesStore.getState().onboardingComplete).toBe(true);
  });

  it('skip goes straight to the dashboard without saving', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Skip' }));
    expect(mockReplace).toHaveBeenCalledWith('/');
    expect(usePreferencesStore.getState().onboardingComplete).toBe(false);
  });
});
