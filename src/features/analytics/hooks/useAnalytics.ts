import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { analyticsService } from '../services/analytics.service';
import type { AnalyticsRange } from '../types/analytics.types';

export const analyticsKeys = {
  overview: (range: AnalyticsRange) => ['analytics', 'overview', range] as const,
};

/** Keeps the previous range on screen while the next one loads, so switching doesn't flash a spinner. */
export function useAnalytics(range: AnalyticsRange) {
  return useQuery({
    queryKey: analyticsKeys.overview(range),
    queryFn: () => analyticsService.getOverview(range),
    placeholderData: keepPreviousData,
  });
}
