import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';

import { ActivityDetailScreen } from '@/features/activities/screens/ActivityDetailScreen';
import type { ActivityRecord } from '@/features/activities/types/activity.types';
import { recordToSnapshot } from '@/features/activities/utils/activity-history.logic';
import { useMockDb } from '@/services/mock-db/mock-db';
import { buildSeed } from '@/services/mock-db/seed';

let mockId = 'a1';
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: mockId }),
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn() }),
}));

const route = [
  { lat: 17.385, lng: 78.486 },
  { lat: 17.386, lng: 78.488 },
  { lat: 17.388, lng: 78.49 },
];
const record: ActivityRecord = {
  id: 'a1',
  kind: 'walk',
  title: 'Morning Walk',
  startedAt: new Date(2026, 10, 18, 7).getTime(),
  endedAt: new Date(2026, 10, 18, 7, 40).getTime(),
  distanceKm: 3.2,
  durationSec: 2400,
  movingSec: 2300,
  avgPaceSecPerKm: 720,
  kcal: 180,
  elevationGainM: 12,
  splits: [],
  route,
  source: 'user',
};

const renderScreen = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <ActivityDetailScreen />
    </QueryClientProvider>,
  );
};

describe('recordToSnapshot', () => {
  it('rebuilds the dashboard view with the recorded route', () => {
    const s = recordToSnapshot(record);
    expect(s).toMatchObject({ kind: 'walk', distanceKm: 3.2, isDemo: false, gpsQuality: 'high' });
    expect(s.route).toEqual(route);
  });

  it('reports no GPS when no route was recorded', () => {
    expect(recordToSnapshot({ ...record, route: [] }).gpsQuality).toBe('none');
  });
});

describe('ActivityDetailScreen', () => {
  beforeEach(() => {
    mockId = 'a1';
    useMockDb.setState({ ...buildSeed(), activities: [record] });
  });

  it('opens a finished activity with its title, date and route', async () => {
    await renderScreen();
    expect((await screen.findAllByText('Morning Walk')).length).toBeGreaterThan(0);
    expect(screen.getByText('Trail Walk')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Morning Walk' })).toBeTruthy();
  });

  it('says so when the activity no longer exists', async () => {
    mockId = 'gone';
    await renderScreen();
    expect(await screen.findByText('Activity not found')).toBeTruthy();
  });

  it('says when no GPS route was recorded', async () => {
    useMockDb.setState({ ...buildSeed(), activities: [{ ...record, route: [] }] });
    await renderScreen();
    expect(await screen.findByText('No GPS route was recorded for this activity.')).toBeTruthy();
  });
});
