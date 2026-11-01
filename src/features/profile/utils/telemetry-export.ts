import type { ActivityRecord } from '@/features/activities/types/activity.types';
import type { WorkoutRecord } from '@/features/workouts/types/workout-record.types';

import type { UserProfile, WeightEntry } from '../types/profile.types';

export interface TelemetryExportInput {
  exportedAt: number;
  profile: UserProfile;
  weights: readonly WeightEntry[];
  workouts: readonly WorkoutRecord[];
  activities: readonly ActivityRecord[];
}

/** The athlete's own data as pretty JSON for the OS share sheet. Sample records stay flagged. */
export function buildTelemetryExport(input: TelemetryExportInput): string {
  return JSON.stringify(
    {
      app: 'FitSphere',
      exportedAt: new Date(input.exportedAt).toISOString(),
      profile: input.profile,
      weights: input.weights,
      workouts: input.workouts,
      activities: input.activities,
    },
    null,
    2,
  );
}
