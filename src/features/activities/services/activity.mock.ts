import type { ActivitySnapshot, LatLng } from '../types/activity.types';

/** Coordinates tracing a loop; purely illustrative sample geometry. */
const SAMPLE_ROUTE: LatLng[] = [
  { lat: 37.7895, lng: -122.4482 },
  { lat: 37.7902, lng: -122.4469 },
  { lat: 37.7906, lng: -122.4451 },
  { lat: 37.7919, lng: -122.4442 },
  { lat: 37.7931, lng: -122.4431 },
  { lat: 37.7936, lng: -122.4414 },
  { lat: 37.7933, lng: -122.4398 },
  { lat: 37.7925, lng: -122.4391 },
];

/** Sample activity copied from the Stitch reference. Always flagged `isDemo`. */
export const sampleActivity: ActivitySnapshot = {
  kind: 'run',
  isDemo: true,
  title: 'Presidio Heights Loop',
  distanceKm: 6.42,
  durationSec: 31 * 60 + 45,
  movingSec: 30 * 60 + 58,
  currentPaceSecPerKm: 288,
  avgPaceSecPerKm: 296,
  targetPaceSecPerKm: 300,
  kcal: 420,
  elevationGainM: 84,
  maxGradePct: 6.2,
  heartRateBpm: 158,
  heartZone: 'Zone 4',
  cadenceSpm: 172,
  splits: [
    { km: 1, paceSecPerKm: 304, isFastest: false },
    { km: 2, paceSecPerKm: 298, isFastest: false },
    { km: 3, paceSecPerKm: 292, isFastest: false },
    { km: 4, paceSecPerKm: 289, isFastest: false },
    { km: 5, paceSecPerKm: 295, isFastest: false },
    { km: 6, paceSecPerKm: 288, isFastest: true },
  ],
  route: SAMPLE_ROUTE,
  gpsQuality: 'high',
  lapCount: 0,
};
