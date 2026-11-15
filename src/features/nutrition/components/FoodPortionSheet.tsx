import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Chip } from '@/components/common/Chip';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { CustomInput } from '@/components/ui/CustomInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

import type { FoodItem } from '../types/food.types';
import type { MealCategory, NewMealInput } from '../types/nutrition.types';
import { foodTitle, mealFromFood, parseGrams, portionMacros } from '../utils/food.logic';
import { MEAL_CATEGORIES } from '../utils/nutrition.logic';

export interface FoodPortionSheetProps {
  food: FoodItem | null;
  /** The meal slot to pre-select, usually the next one still empty today. */
  defaultCategory: MealCategory;
  onClose: () => void;
  onAdd: (meal: NewMealInput) => Promise<unknown>;
}

/** Choose how much you ate and which meal it belongs to, see the nutrition, then add it to today's log. */
export function FoodPortionSheet({ food, defaultCategory, onClose, onAdd }: FoodPortionSheetProps) {
  // A fresh form for every food: the key resets the amount and the chosen meal.
  return food ? (
    <PortionForm
      key={food.id}
      food={food}
      defaultCategory={defaultCategory}
      onClose={onClose}
      onAdd={onAdd}
    />
  ) : null;
}

function PortionForm({
  food,
  defaultCategory,
  onClose,
  onAdd,
}: Omit<FoodPortionSheetProps, 'food'> & { food: FoodItem }) {
  const [amount, setAmount] = useState(String(food.servingG ?? 100));
  const [category, setCategory] = useState<MealCategory>(defaultCategory);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grams = food.adjustable ? parseGrams(amount) : food.basis.amountG;
  const preview = useMemo(
    () => (grams === null ? null : food.adjustable ? portionMacros(food.basis, grams) : food.basis),
    [food, grams],
  );

  const add = async () => {
    if (grams === null) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd(mealFromFood(food, grams, category));
    } catch {
      setError("Couldn't save this meal. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible onClose={onClose} title={foodTitle(food)}>
      <View style={{ gap: 12 }}>
        {food.adjustable ? (
          <>
            <CustomInput
              label="Amount (grams)"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              error={grams === null ? 'Enter an amount from 1 to 5000 g' : undefined}
              helperText={`Nutrition values are per ${food.basis.amountG} g.`}
            />
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Chip label="100 g" selected={amount === '100'} onPress={() => setAmount('100')} />
              {food.servingG ? (
                <Chip
                  label={`1 serving (${food.servingG} g)`}
                  selected={amount === String(food.servingG)}
                  onPress={() => setAmount(String(food.servingG))}
                />
              ) : null}
            </View>
          </>
        ) : (
          <AppText variant="bodySm" color="onSurfaceVariant">
            Logged again exactly as before.
          </AppText>
        )}

        <View
          accessibilityLabel="Nutrition for this amount"
          style={{ flexDirection: 'row', justifyContent: 'space-between' }}
        >
          {[
            ['Calories', preview ? `${preview.kcal}` : '—'],
            ['Protein', preview ? `${preview.protein} g` : '—'],
            ['Carbs', preview ? `${preview.carbs} g` : '—'],
            ['Fat', preview ? `${preview.fat} g` : '—'],
          ].map(([label, value]) => (
            <View key={label} style={{ alignItems: 'center', gap: 2 }}>
              <AppText variant="headlineMd" tabular>
                {value}
              </AppText>
              <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
                {label}
              </AppText>
            </View>
          ))}
        </View>

        <View style={{ gap: 6 }}>
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            Meal
          </AppText>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {MEAL_CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                icon={c.icon}
                selected={category === c.id}
                onPress={() => setCategory(c.id)}
              />
            ))}
          </View>
        </View>

        {error ? (
          <AppText variant="bodySm" color="error" accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}
        <PrimaryButton
          label="Add to today"
          onPress={() => void add()}
          loading={saving}
          disabled={grams === null}
        />
        <SecondaryButton label="Cancel" onPress={onClose} size="md" />
      </View>
    </BottomSheet>
  );
}
