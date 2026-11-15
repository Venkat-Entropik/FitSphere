import { useMockDb } from '@/services/mock-db/mock-db';
import { dateKey } from '@/utils/date';
import { currentStreak } from '@/utils/streak';

/** Consecutive days with a logged workout or activity, read from the on-device log (works offline). */
export function useStreak(): number {
  const workouts = useMockDb((s) => s.workouts);
  const activities = useMockDb((s) => s.activities);
  return currentStreak([...workouts, ...activities].map((r) => dateKey(r.startedAt)));
}
