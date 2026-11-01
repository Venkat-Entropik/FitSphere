import { useQuery } from '@tanstack/react-query';

import { progressService } from '../services/progress.service';

export const progressKeys = { overview: ['progress', 'overview'] as const };

export function useProgress() {
  return useQuery({
    queryKey: progressKeys.overview,
    queryFn: () => progressService.getOverview(),
  });
}
