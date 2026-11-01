import { Pressable, View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTheme } from '@/theme';

import { formatLitres, ratio, WATER_STEPS_ML } from '../utils/nutrition.logic';

const STEP_ICON: Record<number, IconName> = { 250: 'add', 500: 'local_drink' };

export interface HydrationCardProps {
  ml: number;
  goalMl: number;
  onAdd: (ml: number) => void;
  busy?: boolean;
}

export function HydrationCard({ ml, goalMl, onAdd, busy = false }: HydrationCardProps) {
  const theme = useTheme();
  return (
    <Card style={{ gap: 8, backgroundColor: theme.colors.surfaceHigh }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="water_drop" size={22} color="secondary" />
          <AppText variant="headlineMd">Hydration</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <AppText variant="metricLg" tabular accessibilityLabel={`${formatLitres(ml)} litres`}>
            {formatLitres(ml)}
          </AppText>
          <AppText variant="bodySm" color="onSurfaceVariant">
            / {formatLitres(goalMl)} L
          </AppText>
        </View>
      </View>
      <ProgressBar progress={ratio(ml, goalMl)} color="secondary" height={8} withGlow />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 4,
        }}
      >
        <AppText variant="bodySm" color="onSurfaceVariant">
          Goal: {goalMl.toLocaleString('en-US')} ml
        </AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {WATER_STEPS_ML.map((step) => (
            <Pressable
              key={step}
              accessibilityRole="button"
              accessibilityLabel={`Add ${step} millilitres of water`}
              disabled={busy}
              onPress={() => onAdd(step)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: theme.radius.pill,
                backgroundColor: pressed ? theme.colors.surfaceHighest : theme.colors.surface,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <Icon name={STEP_ICON[step] ?? 'add'} size={18} color="secondary" />
              <AppText variant="labelUi" weight="semibold">
                +{step} ml
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
    </Card>
  );
}
