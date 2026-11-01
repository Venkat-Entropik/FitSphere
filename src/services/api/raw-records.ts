import { activityService } from '@/features/activities/services/activity.service';
import { profileService } from '@/features/profile/services/profile.service';
import { workoutService } from '@/features/workouts/services/workout.service';

/**
 * The server stores raw per-user records; dashboard, analytics and progress are computed on the client
 * from them by the same pure aggregators the mock backend uses.
 */
export async function loadRawRecords() {
  const [profile, workouts, activities, weights, plans] = await Promise.all([
    profileService.getProfile(),
    workoutService.getHistory(),
    activityService.getHistory(),
    profileService.getWeights(),
    workoutService.getPlans(),
  ]);
  return { profile, workouts, activities, weights, plans };
}
