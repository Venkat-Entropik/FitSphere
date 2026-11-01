import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import type { AnalyticsOverview } from '../types/analytics.types';

export function DeepDiveCard({ benchmark }: { benchmark: AnalyticsOverview['nextBenchmark'] }) {
  const theme = useTheme();
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Icon name="tune" size={20} color="onSurfaceVariant" />
          <AppText variant="headlineMd" weight="bold" style={{ flexShrink: 1 }}>
            Biometric Deep Dive
          </AppText>
        </View>
        <View
          accessibilityLabel="Configure sensors (coming soon)"
          style={{ opacity: 0.7, alignItems: 'flex-end' }}
        >
          <AppText variant="labelCaps" color="primary" style={{ textAlign: 'right' }}>
            Configure{'\n'}Sensors
          </AppText>
        </View>
      </View>
      {/* The benchmark photo in the Stitch export is a remote asset; a tonal gradient stands in. */}
      <View
        style={{
          height: 120,
          borderRadius: theme.radius.sm,
          overflow: 'hidden',
          justifyContent: 'flex-end',
        }}
      >
        <LinearGradient
          colors={[theme.colors.surfaceHighest, theme.colors.surfaceLowest]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: 12,
          }}
        >
          <View style={{ flexShrink: 1 }}>
            <AppText variant="labelCaps" color="primary" uppercase>
              Next Benchmark
            </AppText>
            <AppText variant="bodyLg" weight="semibold">
              {benchmark.title}
            </AppText>
          </View>
          <AppText variant="labelCaps" color="onSurfaceVariant" weight="regular">
            {benchmark.whenLabel}
          </AppText>
        </View>
      </View>
    </Card>
  );
}
