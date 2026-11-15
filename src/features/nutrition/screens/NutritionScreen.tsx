import { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/ui/Icon';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

import { DailyFuelCard } from '../components/DailyFuelCard';
import { FoodLogFlow, type FoodSurface } from '../components/FoodLogFlow';
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
  useRemoveMeal,
} from '../hooks/useNutrition';
import type { Meal } from '../types/nutrition.types';
import { consumedMacros, loggedLabel, macroTip, nextMealCategory } from '../utils/nutrition.logic';

export function NutritionScreen() {
  const { data: day, dateKey, isPending, error, refetch } = useNutritionDay();
  const addWater = useAddWater(dateKey, day?.hydrationGoalMl ?? 3500);
  const logMeal = useLogMeal(dateKey);
  const logRecommended = useLogRecommendedMeal(dateKey);
  const removeMeal = useRemoveMeal(dateKey);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [surface, setSurface] = useState<FoodSurface>('closed');
  const [removing, setRemoving] = useState<Meal | null>(null);

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
  const recommendation = day.recommendation;
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
          <MealCard key={meal.id} meal={meal} onRemove={() => setRemoving(meal)} />
        ))}
        {recommendation ? (
          <RecommendedMealCard
            meal={recommendation}
            onLog={() => logRecommended.mutate(recommendation)}
            busy={logRecommended.isPending}
          />
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <SecondaryButton
            label="Scan Barcode"
            onPress={() => setSurface('scan')}
            leftIcon={<Icon name="qr_code_scanner" size={18} color="primary" />}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Add Food"
            onPress={() => setSurface('search')}
            leftIcon={<Icon name="add" size={20} color="onPrimary" />}
          />
        </View>
      </View>
      <FoodLogFlow
        surface={surface}
        onSurfaceChange={setSurface}
        defaultCategory={nextMealCategory(day.meals) ?? 'snack'}
        onLog={(meal) => logMeal.mutateAsync(meal)}
        onManual={() => setQuickAddOpen(true)}
      />
      <ConfirmationModal
        visible={removing !== null}
        title="Remove this meal?"
        message={removing ? `${removing.title} will be taken out of today's log.` : undefined}
        confirmLabel="Remove"
        destructive
        loading={removeMeal.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          removeMeal.mutate(removing.id, { onSuccess: () => setRemoving(null) });
        }}
      />
      <QuickAddSheet
        visible={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSubmit={(meal) => logMeal.mutateAsync(meal)}
      />
    </Screen>
  );
}
