import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { mockProgress } from '@/features/progress/services/progress.mock';
import { ProgressScreen } from '@/features/progress/screens/ProgressScreen';
import {
  adherencePercent,
  badgeProgressLabel,
  badgeProgressRatio,
  bodyDelta,
  countUnlocked,
  signedDelta,
  weeksToTarget,
} from '@/features/progress/utils/progress.logic';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

describe('progress logic', () => {
  it('computes body deltas from baseline to current', () => {
    const { baseline, current } = mockProgress.transformation;
    expect(bodyDelta(baseline, current)).toEqual({
      weightKg: 1.3,
      bodyFatPercent: -1.4,
      muscleKg: 0.9,
    });
    expect(signedDelta(1.3)).toBe('+1.3');
    expect(signedDelta(-1.4)).toBe('-1.4');
  });

  it('computes adherence from active days in the window', () => {
    expect(adherencePercent(mockProgress.streak.heatmap, 14)).toBe(100);
    expect(adherencePercent(mockProgress.streak.heatmap.slice(0, 7), 14)).toBe(50);
    expect(adherencePercent([], 0)).toBe(0);
  });

  it('describes badge progress', () => {
    const [centurion, volume] = mockProgress.badges.items.filter((b) => b.status === 'locked');
    expect(badgeProgressLabel(centurion!)).toBe('74 / 100');
    expect(badgeProgressRatio(centurion!)).toBe(0.74);
    expect(badgeProgressLabel(volume!)).toBe('62.8k / 100k kg');
    expect(countUnlocked(mockProgress.badges.items)).toBe(3);
  });

  it('projects weeks to a target and refuses impossible ones', () => {
    expect(weeksToTarget(68.5, 70, 0.3)).toBe(5);
    expect(weeksToTarget(68.5, 70, 0)).toBeNull();
    expect(weeksToTarget(71, 70, 0.3)).toBeNull();
  });
});

describe('ProgressScreen', () => {
  const renderScreen = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    return render(
      <QueryClientProvider client={client}>
        <ProgressScreen />
      </QueryClientProvider>,
    );
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders streak, records, transformation deltas and badges', async () => {
    await renderScreen();
    expect(await screen.findByText('14-Day Streak')).toBeTruthy();
    expect(screen.getByText('Incline DB Press')).toBeTruthy();
    expect(screen.getByText('68.5 kg (+1.3)')).toBeTruthy();
    expect(screen.getByText('13.8% (-1.4%)')).toBeTruthy();
    expect(screen.getByText('Centurion Club')).toBeTruthy();
    expect(screen.getByText('74 / 100')).toBeTruthy();
  });

  it('explains when camera permission is denied and never opens the camera', async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false });
    await renderScreen();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Log Progress Photo & InBody Scan' }),
    );
    await waitFor(() => expect(screen.getByText(/Camera access is off/)).toBeTruthy());
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('shows the captured photo in the current panel', async () => {
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    await renderScreen();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Log Progress Photo & InBody Scan' }),
    );
    await waitFor(() => expect(screen.getByLabelText('Progress photo')).toBeTruthy());
  });
});
