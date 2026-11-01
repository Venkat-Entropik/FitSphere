import { useCallback } from 'react';
import { Share } from 'react-native';

import { activityService } from '@/features/activities/services/activity.service';
import { workoutService } from '@/features/workouts/services/workout.service';

import { profileService } from '../services/profile.service';
import { buildTelemetryExport } from '../utils/telemetry-export';

/** Collects the athlete's data and hands it to the OS share sheet. */
export function useExportTelemetry() {
  return useCallback(async () => {
    const [profile, weights, workouts, activities] = await Promise.all([
      profileService.getProfile(),
      profileService.getWeights(),
      workoutService.getHistory(),
      activityService.getHistory(),
    ]);
    const message = buildTelemetryExport({
      exportedAt: Date.now(),
      profile,
      weights,
      workouts,
      activities,
    });
    await Share.share({ title: 'FitSphere telemetry export', message });
  }, []);
}
