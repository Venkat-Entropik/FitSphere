import { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/ui/Icon';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

import { DailyFuelCard } from '../components/DailyFuelCard';
import { HydrationCard } from '../components/HydrationCard';
import { MacroCoachCard } from '../components/MacroCoachCard';
import { MealCard } from '../components/MealCard';
import { QuickAddSheet } from '../components/QuickAddSheet';
import { RecommendedMealCard } from '../components/RecommendedMealCard';
import {
  useAddWater,
  useLogMeal,
  useLogRecommendedMeal,
  useNutritionDay,
} from '../hooks/useNutrition';
import { consumedMacros, loggedLabel, macroTip } from '../utils/nutrition.logic';

export function NutritionScreen() {
  const { data: day, isPending, error, refetch } = useNutritionDay();
  const addWater = useAddWater();
  const logMeal = useLogMeal();
  const logRecommended = useLogRecommendedMeal();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  if (isPending) {
    return (
      <Screen>
        <LoadingIndicator fullScreen label="Loading nutrition" />
      </Screen>
    );
  }
  if (error || !day) {
    return (
      <Screen>
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const tip = macroTip(day);
  return (
    <Screen scroll>
      <DailyFuelCard day={day} consumedMacros={consumedMacros(day.meals)} />
      <MacroCoachCard shortfallG={tip.shortfallG} text={tip.text} />
      <HydrationCard
        ml={day.hydrationMl}
        goalMl={day.hydrationGoalMl}
        onAdd={(ml) => addWater.mutate(ml)}
        busy={addWater.isPending}
      />
      <View style={{ gap: 8, paddingTop: 4 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <AppText variant="headlineMd" accessibilityRole="header">
            Meal Telemetry
          </AppText>
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            {loggedLabel(day)}
          </AppText>
        </View>
        {day.meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} />
        ))}
        {day.recommendation ? (
          <RecommendedMealCard
            meal={day.recommendation}
            onLog={() => logRecommended.mutate()}
            busy={logRecommended.isPending}
          />
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <SecondaryButton
            label="Scan Barcode"
            onPress={() => undefined}
            disabled
            leftIcon={<Icon name="qr_code_scanner" size={18} color="primary" />}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Quick Add Food"
            onPress={() => setQuickAddOpen(true)}
            leftIcon={<Icon name="add" size={20} color="onPrimary" />}
          />
        </View>
      </View>
      <QuickAddSheet
        visible={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSubmit={(meal) => logMeal.mutateAsync(meal)}
      />
    </Screen>
  );
}
