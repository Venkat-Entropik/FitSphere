import { useQuery } from '@tanstack/react-query';

import { dashboardService } from '../services/dashboard.service';

export const dashboardKeys = { summary: ['dashboard', 'summary'] as const };

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: () => dashboardService.getSummary(),
  });
}
