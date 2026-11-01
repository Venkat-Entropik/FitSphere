import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import type { MealRecommendation } from '../types/nutrition.types';
import { categoryMeta } from '../utils/nutrition.logic';

const SHORT_LABEL = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
} as const;

export interface RecommendedMealCardProps {
  meal: MealRecommendation;
  onLog: () => void;
  busy?: boolean;
}

export function RecommendedMealCard({ meal, onLog, busy = false }: RecommendedMealCardProps) {
  const theme = useTheme();
  const shortLabel = SHORT_LABEL[meal.category];
  return (
    <Card style={{ gap: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: theme.radius.sm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.surfaceHighest,
            }}
          >
            <Icon name={categoryMeta(meal.category).icon} size={20} color="primary" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="labelCaps" color="primary" uppercase>
              Recommended {shortLabel}{' '}
              <AppText variant="labelCaps" color="onSurfaceVariant" weight="regular">
                • Target: ~{meal.kcal} kcal
              </AppText>
            </AppText>
            <AppText variant="headlineMd" weight="semibold" style={{ lineHeight: 24 }}>
              {meal.title}
            </AppText>
          </View>
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surfaceHighest,
          }}
        >
          <AppText variant="labelCaps" color="onSurfaceVariant" weight="regular">
            Upcoming
          </AppText>
        </View>
      </View>
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.surfaceLowest,
        }}
      >
        <AppText variant="bodySm" color="onSurfaceVariant">
          Suggested: {meal.protein}g Protein • {meal.carbs}g Carbs • {meal.fat}g Fat
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <View style={{ flex: 1 }}>
          <Button
            label={`Log Recommended ${shortLabel}`}
            onPress={onLog}
            loading={busy}
            leftIcon={<Icon name="check_circle" size={18} color="onPrimary" />}
          />
        </View>
        <View
          accessibilityLabel="Scan barcode (coming soon)"
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surfaceHigh,
            opacity: 0.6,
          }}
        >
          <Icon name="qr_code_scanner" size={20} color="onSurfaceVariant" />
        </View>
      </View>
    </Card>
  );
}
