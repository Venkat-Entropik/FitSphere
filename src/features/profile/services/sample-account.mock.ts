/**
 * The app has no device-pairing or billing integration yet. These typed samples feed the Connected
 * Telemetry and Membership cards from the Stitch design; the UI labels them as sample data and keeps
 * their actions disabled.
 */
export type SensorStatus = 'syncing' | 'synced' | 'connected' | 'standby';

export interface SampleSensor {
  id: string;
  name: string;
  detail: string;
  status: SensorStatus;
  icon: string;
  /** Trailing glyph shown in the design for each row. */
  trailingIcon: string;
}

export const sampleSensors: SampleSensor[] = [
  {
    id: 'healthkit',
    name: 'Apple HealthKit',
    detail: 'Connected • Syncing live',
    status: 'syncing',
    icon: 'security',
    trailingIcon: 'check_circle',
  },
  {
    id: 'inbody',
    name: 'InBody 570 Smart Scale',
    detail: 'Last synced 2d ago • 68.5 kg',
    status: 'synced',
    icon: 'hourglass_empty',
    trailingIcon: 'sync',
  },
  {
    id: 'whoop',
    name: 'WHOOP 4.0 Strap',
    detail: 'Connected • 92% Recovery',
    status: 'connected',
    icon: 'vital_signs',
    trailingIcon: 'battery_charging_full',
  },
  {
    id: 'polar',
    name: 'Polar H10 Chest HRM',
    detail: 'Bluetooth Paired • Standby',
    status: 'standby',
    icon: 'bluetooth',
    trailingIcon: 'chevron_right',
  },
];

export interface SampleMembership {
  title: string;
  description: string;
  tierLabel: string;
  renewsLabel: string;
}

export const sampleMembership: SampleMembership = {
  title: 'FitSphere Elite AI Member',
  description:
    'Priority GPU inference allocated for real-time biomechanical analysis and strain forecasting.',
  tierLabel: 'PRO TIER',
  renewsLabel: 'Auto-renews: Nov 18, 2025',
};
