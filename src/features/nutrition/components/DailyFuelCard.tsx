import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { glow, useTheme, type ColorToken } from '@/theme';

import type { DailyNutrition, Macros } from '../types/nutrition.types';
import { consumedKcal, kcalLeft, ratio } from '../utils/nutrition.logic';

function MacroTile({
  label,
  color,
  barColor,
  value,
  target,
  withGlow,
}: {
  label: string;
  color: ColorToken;
  barColor: ColorToken;
  value: number;
  target: number;
  withGlow: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        gap: 6,
        padding: 10,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="labelCaps" color={color}>
          {label}
        </AppText>
        <AppText variant="labelCaps" color="onSurfaceVariant" weight="regular">
          {Math.round(ratio(value, target) * 100)}%
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <AppText variant="headlineMd" tabular style={{ lineHeight: 22 }}>
          {Math.round(value)}
        </AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          / {target}g
        </AppText>
      </View>
      <ProgressBar
        progress={ratio(value, target)}
        color={barColor}
        height={6}
        withGlow={withGlow}
      />
    </View>
  );
}

export interface DailyFuelCardProps {
  day: DailyNutrition;
  consumedMacros: Macros;
}

export function DailyFuelCard({ day, consumedMacros }: DailyFuelCardProps) {
  const theme = useTheme();
  const consumed = consumedKcal(day.meals);
  const progress = ratio(consumed, day.budgetKcal);
  return (
    <View style={{ gap: 8 }}>
      <Card style={{ gap: 16, backgroundColor: theme.colors.surfaceHigh }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View
              style={[
                { width: 6, height: 16, borderRadius: 3, backgroundColor: theme.colors.primary },
                glow(theme.colors.primary, 0.9, 6),
              ]}
            />
            <AppText variant="headlineMd">Daily Fuel</AppText>
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.surfaceLowest,
              flexShrink: 1,
              marginLeft: 8,
            }}
          >
            <AppText variant="labelCaps" color="onSurfaceVariant" uppercase numberOfLines={2}>
              Target: {day.goalLabel}
            </AppText>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 }}>
          <ProgressRing
            rings={[{ progress, color: 'primary' }]}
            size={144}
            strokeWidth={10}
            inset={6}
            accessibilityLabel={`${consumed} of ${day.budgetKcal} calories consumed`}
          >
            <AppText variant="metricLg" tabular style={{ lineHeight: 28 }}>
              {consumed.toLocaleString('en-US')}
            </AppText>
            <AppText
              variant="labelCaps"
              color="onSurfaceVariant"
              uppercase
              style={{ marginTop: 4 }}
            >
              Consumed
            </AppText>
            <AppText variant="bodySm" color="primary" weight="semibold" style={{ marginTop: 2 }}>
              {kcalLeft(day).toLocaleString('en-US')} left
            </AppText>
          </ProgressRing>
          <View style={{ flex: 1, gap: 10, justifyContent: 'center' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <AppText variant="bodySm" color="onSurfaceVariant">
                Daily Budget
              </AppText>
              <AppText variant="labelUi" weight="semibold" tabular>
                {day.budgetKcal.toLocaleString('en-US')} kcal
              </AppText>
            </View>
            <ProgressBar progress={progress} height={6} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 }}>
              <View>
                <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
                  Athlete
                </AppText>
                <AppText variant="bodyMd" weight="semibold">
                  {day.athleteName}
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
                  Bodyweight
                </AppText>
                <AppText variant="bodyMd" weight="semibold" tabular>
                  {day.weightKg} kg
                </AppText>
              </View>
            </View>
          </View>
        </View>
      </Card>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <MacroTile
          label="Protein"
          color="primary"
          barColor="primary"
          value={consumedMacros.protein}
          target={day.macroTargets.protein}
          withGlow
        />
        <MacroTile
          label="Carbs"
          color="secondary"
          barColor="secondary"
          value={consumedMacros.carbs}
          target={day.macroTargets.carbs}
          withGlow
        />
        <MacroTile
          label="Fats"
          color="primaryDim"
          barColor="primaryDim"
          value={consumedMacros.fat}
          target={day.macroTargets.fat}
          withGlow={false}
        />
      </View>
    </View>
  );
}
