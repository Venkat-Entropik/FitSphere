import type { QueryClient } from '@tanstack/react-query';

/** What changed on the server; each kind lists every cache that derives from it. */
export type DataChange = 'workout' | 'activity' | 'nutrition' | 'profile' | 'weight';

const AFFECTED: Record<DataChange, readonly (readonly string[])[]> = {
  workout: [['workouts', 'history'], ['dashboard'], ['analytics'], ['progress']],
  activity: [['activities', 'history'], ['dashboard'], ['analytics'], ['progress']],
  nutrition: [['nutrition'], ['dashboard']],
  profile: [['profile'], ['nutrition'], ['analytics'], ['dashboard'], ['progress']],
  weight: [['profile'], ['analytics'], ['progress'], ['nutrition']],
};

/** Single place that decides which cached queries go stale after a write. */
export function invalidateAfter(queryClient: QueryClient, change: DataChange): Promise<void[]> {
  return Promise.all(
    AFFECTED[change].map((queryKey) => queryClient.invalidateQueries({ queryKey: [...queryKey] })),
  );
}
