import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

export interface DistanceHeroCardProps {
  distanceKm: number;
  cadenceSpm: number | null;
}

export function DistanceHeroCard({ distanceKm, cadenceSpm }: DistanceHeroCardProps) {
  const theme = useTheme();
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="route" size={16} color="primary" />
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            Total Distance
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
          <AppText
            variant="displayHeroMobile"
            tabular
            accessibilityLabel={`${distanceKm.toFixed(2)} kilometres`}
          >
            {distanceKm.toFixed(2)}
          </AppText>
          <AppText variant="headlineMd" color="onSurfaceVariant" weight="semibold">
            km
          </AppText>
        </View>
      </View>
      <View
        style={{
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.surfaceHigh,
        }}
      >
        <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
          Cadence
        </AppText>
        <AppText variant="headlineMd" color="secondary" tabular>
          {cadenceSpm ?? '--'}{' '}
          <AppText variant="labelCaps" color="onSurfaceVariant">
            spm
          </AppText>
        </AppText>
      </View>
    </Card>
  );
}
