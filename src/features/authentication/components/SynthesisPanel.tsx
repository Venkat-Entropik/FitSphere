import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import type { NutritionSynthesis } from '../types/onboarding.types';

function Stat({
  label,
  children,
  caption,
}: {
  label: string;
  children: React.ReactNode;
  caption: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        padding: 8,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surfaceLowest,
      }}
    >
      <AppText
        variant="labelCaps"
        color="onSurfaceVariant"
        uppercase
        style={{ textAlign: 'center' }}
      >
        {label}
      </AppText>
      {children}
      <AppText variant="bodySm" color="outline" style={{ textAlign: 'center' }}>
        {caption}
      </AppText>
    </View>
  );
}

export function SynthesisPanel({ synthesis }: { synthesis: NutritionSynthesis }) {
  const theme = useTheme();
  return (
    <Card style={{ gap: 12, backgroundColor: theme.colors.surfaceHigh }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="auto_awesome" size={16} color="primary" />
        <AppText variant="labelUi" color="onSurface" weight="semibold">
          Your starting targets
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Stat label="Calories" caption="kcal / day">
          <AppText variant="metricLg" color="onSurface" tabular>
            ~{synthesis.baselineKcal.toLocaleString('en-US')}
          </AppText>
        </Stat>
        <Stat label="Protein" caption={`${synthesis.proteinPerKg}g / kg`}>
          <AppText variant="metricLg" color="primary" tabular>
            {synthesis.proteinG}
            <AppText variant="bodyMd" color="primary">
              g
            </AppText>
          </AppText>
        </Stat>
        <Stat label="Split" caption={synthesis.split.label}>
          <AppText variant="headlineMd" color="secondary">
            {synthesis.split.code}
          </AppText>
        </Stat>
      </View>
      <AppText variant="bodySm" color="onSurfaceVariant">
        General estimates for planning, not medical advice.
      </AppText>
    </Card>
  );
}
