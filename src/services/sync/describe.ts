import type { SyncChange } from './types';

/** A change in plain words, for the list of things waiting or refused. */
export function describeChange(change: SyncChange): string {
  switch (change.type) {
    case 'workout.save':
      return `Workout: ${change.record.title}`;
    case 'activity.save':
      return `${change.record.title} (${change.record.distanceKm.toFixed(1)} km)`;
    case 'meal.log':
      return `Meal: ${change.meal.title}`;
    case 'meal.remove':
      return 'Removed a meal';
    case 'water.add':
      return change.ml >= 0 ? `Water +${change.ml} ml` : `Water ${change.ml} ml`;
    case 'weight.log':
      return `Weight: ${change.entry.kg} kg`;
    case 'profile.save':
    case 'profile.patch':
      return 'Profile changes';
  }
}

/** "just now", "5 min ago", "3 h ago", "2 days ago". */
export function formatAgo(then: number, now: number = Date.now()): string {
  const minutes = Math.floor((now - then) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}
