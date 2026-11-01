export type ActivityKind = 'run' | 'cycle' | 'walk' | 'cardio' | 'hiit';

export interface GpsPoint {
  lat: number;
  lng: number;
  /** Metres above sea level; null when the device doesn't report it. */
  altitude: number | null;
  /** Horizontal accuracy in metres. */
  accuracy: number | null;
  /** Epoch ms. */
  timestamp: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Split {
  km: number;
  paceSecPerKm: number;
  isFastest: boolean;
}

export type GpsQuality = 'high' | 'medium' | 'low' | 'none';

/**
 * Everything the activity UI displays. Built from recorded GPS points (`isDemo: false`)
 * or from the bundled sample (`isDemo: true`) — never mixed.
 */
export interface ActivitySnapshot {
  kind: ActivityKind;
  isDemo: boolean;
  /** Short label shown on the map overlay, e.g. a route name. */
  title: string;
  distanceKm: number;
  durationSec: number;
  movingSec: number;
  currentPaceSecPerKm: number | null;
  avgPaceSecPerKm: number | null;
  targetPaceSecPerKm: number | null;
  /** Estimated from distance/duration and body weight, not measured. */
  kcal: number;
  elevationGainM: number;
  maxGradePct: number | null;
  /** null when no sensor is connected. */
  heartRateBpm: number | null;
  heartZone: string | null;
  cadenceSpm: number | null;
  splits: Split[];
  route: LatLng[];
  gpsQuality: GpsQuality;
  lapCount: number;
}

export interface KindOption {
  kind: ActivityKind;
  label: string;
  icon: string;
  /** Whether GPS route tracking applies to this kind. */
  usesGps: boolean;
}
