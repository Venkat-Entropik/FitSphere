import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTheme, type ColorToken } from '@/theme';

import type { RecoverySnapshot } from '../types/dashboard.types';
import { formatSleep } from '../utils/telemetry';

interface BiomarkerTileProps {
  label: string;
  value: string;
  unit?: string;
  icon: IconName;
  iconColor: ColorToken;
}

function BiomarkerTile({ label, value, unit, icon, iconColor }: BiomarkerTileProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View>
        <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
          {label}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
          <AppText variant="headlineMd" tabular>
            {value}
          </AppText>
          {unit ? (
            <AppText
              variant="labelCaps"
              color="onSurfaceVariant"
              weight="regular"
              style={{ fontSize: 12 }}
            >
              {unit}
            </AppText>
          ) : null}
        </View>
      </View>
      <Icon name={icon} size={20} color={iconColor} />
    </View>
  );
}

export function RecoveryCard({ recovery }: { recovery: RecoverySnapshot }) {
  const theme = useTheme();
  return (
    <Card tone="low" style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="vital_signs" size={20} color="secondary" />
          <AppText variant="labelUi" weight="semibold">
            Recovery &amp; Biomarkers
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
      <View style={{ flexDirection: 'row', gap: 8, paddingTop: 4 }}>
        <BiomarkerTile
          label="HRV Strain"
          value={String(recovery.hrvMs)}
          unit="ms"
          icon="ecg_heart"
          iconColor="secondary"
        />
        <BiomarkerTile
          label="Rest & Sleep"
          value={formatSleep(recovery.sleepMinutes)}
          icon="bedtime"
          iconColor="tertiary"
        />
      </View>
    </Card>
  );
}
