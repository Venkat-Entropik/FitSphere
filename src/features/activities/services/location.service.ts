import * as Location from 'expo-location';

import type { GpsPoint } from '../types/activity.types';

export interface PositionSubscription {
  remove: () => void;
}

/** Whether the OS location services (not the permission) are switched on. */
export async function areLocationServicesEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    return false;
  }
}

/**
 * Streams real GPS fixes. Resolves to a subscription the caller must `remove()`.
 * Rejects if the device cannot provide a position stream (e.g. unsupported platform).
 */
export async function watchPositions(
  onPoint: (point: GpsPoint) => void,
  onError: (message: string) => void,
): Promise<PositionSubscription> {
  try {
    return await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 3 },
      (loc) =>
        onPoint({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          altitude: loc.coords.altitude,
          accuracy: loc.coords.accuracy,
          timestamp: loc.timestamp,
        }),
    );
  } catch (error) {
    onError(error instanceof Error ? error.message : 'GPS is unavailable on this device.');
    throw error;
  }
}
