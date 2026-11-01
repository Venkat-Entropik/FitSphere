import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import type { AnalyticsOverview } from '../types/analytics.types';

export function SynthesisCard({ synthesis }: { synthesis: AnalyticsOverview['synthesis'] }) {
  const theme = useTheme();
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <View
        style={{
          padding: 8,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceHigh,
        }}
      >
        <Icon name="auto_awesome" size={22} color="primary" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AppText variant="labelCaps" color="primary" uppercase weight="bold">
            Biometric Synthesis
          </AppText>
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: theme.radius.xs,
              backgroundColor: theme.colors.surfaceHighest,
            }}
          >
            <AppText
              variant="labelCaps"
              color="onSurfaceVariant"
              style={{ fontSize: 9, lineHeight: 12 }}
            >
              {synthesis.status}
            </AppText>
          </View>
        </View>
        <AppText variant="bodyMd" style={{ marginTop: 4, lineHeight: 21 }}>
          Peak torque correlates directly with sleep exceeding{' '}
          <AppText variant="bodyMd" color="primary" weight="semibold">
            {synthesis.sleepThreshold}
          </AppText>{' '}
          and HRV above{' '}
          <AppText variant="bodyMd" color="secondary" weight="semibold">
            {synthesis.hrvThresholdMs}ms
          </AppText>
          . Neuromuscular recovery remains in the prime zone.
        </AppText>
      </View>
    </Card>
  );
}
