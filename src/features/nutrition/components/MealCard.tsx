import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import type { Meal } from '../types/nutrition.types';
import { categoryMeta, formatMealTime } from '../utils/nutrition.logic';

export function MealCard({ meal }: { meal: Meal }) {
  const theme = useTheme();
  const meta = categoryMeta(meal.category);
  return (
    <Card style={{ gap: 4, backgroundColor: theme.colors.surfaceHigh, ...theme.shadows.sm }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: theme.radius.sm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.surface,
            }}
          >
            <Icon name={meta.icon} size={20} color="onSurfaceVariant" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppText
                variant="labelCaps"
                color="onSurfaceVariant"
                uppercase
                style={{ flexShrink: 1 }}
              >
                {meta.label}
              </AppText>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.colors.primary,
                }}
              />
              {meal.loggedAt ? (
                <AppText variant="labelCaps" color="primary">
                  {formatMealTime(meal.loggedAt)}
                </AppText>
              ) : null}
            </View>
            <AppText variant="headlineMd" weight="semibold" style={{ lineHeight: 24 }}>
              {meal.title}
            </AppText>
          </View>
        </View>
        <View
          accessibilityLabel={`Edit ${meta.label} (coming soon)`}
          style={{ padding: 4, opacity: 0.6 }}
        >
          <Icon name="edit" size={20} color="onSurfaceVariant" />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8 }}>
        {/* Meal photos are remote assets in the Stitch export; a neutral tile stands in. */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: theme.radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surface,
          }}
        >
          <Icon name={meta.icon === 'bolt' ? 'nutrition' : meta.icon} size={24} color="outline" />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <AppText variant="labelUi" weight="semibold" tabular>
              {meal.kcal} kcal
            </AppText>
            <AppText variant="labelCaps" color="onSurfaceVariant" weight="regular">
              Logged
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppText variant="bodySm" color="primary" weight="medium" tabular>
              {meal.protein}g P
            </AppText>
            <AppText variant="bodySm" color="onSurfaceVariant">
              •
            </AppText>
            <AppText variant="bodySm" color="secondary" weight="medium" tabular>
              {meal.carbs}g C
            </AppText>
            <AppText variant="bodySm" color="onSurfaceVariant">
              •
            </AppText>
            <AppText variant="bodySm" color="onSurfaceVariant" weight="medium" tabular>
              {meal.fat}g F
            </AppText>
          </View>
        </View>
      </View>
    </Card>
  );
}
