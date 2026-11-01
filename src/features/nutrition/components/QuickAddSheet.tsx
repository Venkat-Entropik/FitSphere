import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Chip } from '@/components/common/Chip';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { CustomInput } from '@/components/ui/CustomInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

import type { NewMealInput } from '../types/nutrition.types';
import { MEAL_CATEGORIES } from '../utils/nutrition.logic';
import {
  quickAddDefaults,
  quickAddSchema,
  toNewMeal,
  type QuickAddValues,
} from '../utils/quick-add.schema';

export interface QuickAddSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (meal: NewMealInput) => Promise<unknown>;
}

export function QuickAddSheet({ visible, onClose, onSubmit }: QuickAddSheetProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuickAddValues>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: quickAddDefaults,
  });

  const close = () => {
    reset(quickAddDefaults);
    onClose();
  };

  const submit = handleSubmit(async (values) => {
    await onSubmit(toNewMeal(values));
    close();
  });

  return (
    <BottomSheet visible={visible} onClose={close} title="Quick Add Food">
      <View style={{ gap: 12 }}>
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <CustomInput
              label="Food"
              placeholder="e.g. Greek yogurt & berries"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.title?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MEAL_CATEGORIES.map((c) => (
                <Chip
                  key={c.id}
                  size="lg"
                  label={c.id === 'snack' ? 'Snack' : c.label}
                  selected={field.value === c.id}
                  onPress={() => field.onChange(c.id)}
                />
              ))}
            </View>
          )}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(
            [
              ['kcal', 'Calories'],
              ['protein', 'Protein g'],
            ] as const
          ).map(([name, label]) => (
            <View key={name} style={{ flex: 1 }}>
              <Controller
                control={control}
                name={name}
                render={({ field }) => (
                  <CustomInput
                    label={label}
                    keyboardType="number-pad"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors[name]?.message}
                  />
                )}
              />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(
            [
              ['carbs', 'Carbs g'],
              ['fat', 'Fat g'],
            ] as const
          ).map(([name, label]) => (
            <View key={name} style={{ flex: 1 }}>
              <Controller
                control={control}
                name={name}
                render={({ field }) => (
                  <CustomInput
                    label={label}
                    keyboardType="number-pad"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors[name]?.message}
                  />
                )}
              />
            </View>
          ))}
        </View>
        <PrimaryButton label="Add to today" onPress={() => void submit()} loading={isSubmitting} />
      </View>
    </BottomSheet>
  );
}
