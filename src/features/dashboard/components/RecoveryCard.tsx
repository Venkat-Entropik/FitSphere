import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTheme } from '@/theme';

import type { RecoverySnapshot } from '../types/dashboard.types';

export function RecoveryCard({ recovery }: { recovery: RecoverySnapshot }) {
  const theme = useTheme();
  return (
    <Card tone="low" style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="vital_signs" size={20} color="secondary" />
          <AppText variant="labelUi" weight="semibold">
            Recovery
          </AppText>
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: theme.radius.pill,
            backgroundColor: 'rgba(197, 242, 106, 0.2)',
          }}
        >
          <AppText variant="labelCaps" color="primary" weight="bold" uppercase>
            {recovery.label}
          </AppText>
        </View>
      </View>
      <View style={{ gap: 6, marginTop: 4 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}
        >
          <AppText variant="bodySm" color="onSurfaceVariant">
            Recovery Score
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <AppText variant="metricLg" tabular>
              {recovery.score}
            </AppText>
            <AppText variant="bodyLg" color="primary">
              %
            </AppText>
          </View>
        </View>
        <ProgressBar
          progress={recovery.score / 100}
          height={10}
          gradient={[theme.colors.secondary, theme.colors.primary, theme.colors.primary]}
          withGlow
          accessibilityLabel={`Recovery score ${recovery.score} percent`}
        />
      </View>
      <AppText variant="bodySm" color="onSurfaceVariant">
        An estimate from how recently and how hard you trained. It does not use sleep or heart-rate
        data.
      </AppText>
    </Card>
  );
}
