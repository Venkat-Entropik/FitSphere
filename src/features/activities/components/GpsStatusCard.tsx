import { Linking, View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import type { ColorToken } from '@/theme';

import type { GpsAvailability } from '../hooks/useActivityRecorder';

interface StatusCopy {
  icon: IconName;
  color: ColorToken;
  title: string;
  message: string;
}

const COPY: Record<Exclude<GpsAvailability, 'not-needed'>, StatusCopy> = {
  checking: {
    icon: 'satellite_alt',
    color: 'onSurfaceVariant',
    title: 'Checking GPS…',
    message: 'Looking for location access on this device.',
  },
  ready: {
    icon: 'satellite_alt',
    color: 'primary',
    title: 'GPS ready',
    message: 'Your route, distance and pace are recorded from real GPS fixes.',
  },
  'needs-permission': {
    icon: 'location_off',
    color: 'warning',
    title: 'Location access needed',
    message:
      'FitSphere needs your location while the app is open to record your route, distance and pace.',
  },
  denied: {
    icon: 'location_off',
    color: 'error',
    title: 'Location access is turned off',
    message: 'Enable location for FitSphere in your device settings to record outdoor activities.',
  },
  'services-off': {
    icon: 'gps_off',
    color: 'warning',
    title: 'Location services are off',
    message: 'Turn on location services in your device settings, then come back to start.',
  },
  error: {
    icon: 'gps_off',
    color: 'error',
    title: 'GPS unavailable',
    message: 'This device could not provide a GPS signal. You can still record an indoor activity.',
  },
};

export interface GpsStatusCardProps {
  availability: Exclude<GpsAvailability, 'not-needed'>;
  onRequestPermission: () => void;
}

export function GpsStatusCard({ availability, onRequestPermission }: GpsStatusCardProps) {
  const copy = COPY[availability];
  return (
    <Card tone="low" style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name={copy.icon} size={24} color={copy.color} />
        <View style={{ flex: 1 }}>
          <AppText variant="labelUi" weight="semibold" accessibilityRole="header">
            {copy.title}
          </AppText>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {copy.message}
          </AppText>
        </View>
      </View>
      {availability === 'needs-permission' ? (
        <SecondaryButton label="Allow location access" onPress={onRequestPermission} />
      ) : null}
      {availability === 'denied' || availability === 'services-off' ? (
        <SecondaryButton label="Open settings" onPress={() => void Linking.openSettings()} />
      ) : null}
    </Card>
  );
}
