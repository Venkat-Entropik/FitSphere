import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { invalidateAfter } from '@/services/api/invalidation';

import { activityService } from '../services/activity.service';
import type { ActivityRecord } from '../types/activity.types';
import { activityBests, sortRecentFirst, thisWeekTotals } from '../utils/activity-history.logic';

export const activityKeys = { history: ['activities', 'history'] as const };

export function useActivityHistory() {
  return useQuery({
    queryKey: activityKeys.history,
    queryFn: () => activityService.getHistory(),
    select: sortRecentFirst,
  });
}

/** Weekly totals and personal bests derived from history. */
export function useActivityStats() {
  const history = useActivityHistory();
  // The week boundary is read once per mount; a screen left open across Monday refreshes on re-entry.
  const [now] = useState(() => Date.now());
  return useMemo(
    () => ({
      ...history,
      week: thisWeekTotals(history.data ?? [], now),
      bests: activityBests(history.data ?? []),
    }),
    [history, now],
  );
}

export function useSaveActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (record: ActivityRecord) => activityService.saveActivity(record),
    onSuccess: () => void invalidateAfter(queryClient, 'activity'),
  });
}
