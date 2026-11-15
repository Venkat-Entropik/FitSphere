import { useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { CustomInput } from '@/components/ui/CustomInput';
import { Icon } from '@/components/ui/Icon';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useTheme } from '@/theme';

import { useFoodSearch, useRecentFoods } from '../hooks/useFoodSearch';
import { FoodSearchError, foodSearchService } from '../services/food-search.service';
import type { FoodItem } from '../types/food.types';
import type { MealCategory, NewMealInput } from '../types/nutrition.types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { FoodPortionSheet } from './FoodPortionSheet';

export type FoodSurface = 'closed' | 'search' | 'scan';

export interface FoodLogFlowProps {
  surface: FoodSurface;
  onSurfaceChange: (surface: FoodSurface) => void;
  /** The meal slot to pre-select, usually the next one still empty today. */
  defaultCategory: MealCategory;
  /** Logs the meal (saved on the phone first, synced later). */
  onLog: (meal: NewMealInput) => Promise<unknown>;
  /** Opens the manual "Quick Add" form. */
  onManual: () => void;
}

function FoodRow({ food, onPress }: { food: FoodItem; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={food.brand ? `${food.name}, ${food.brand}` : food.name}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: theme.radius.sm,
        backgroundColor: pressed ? theme.colors.surfaceBright : theme.colors.surface,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyMd" weight="semibold" numberOfLines={2}>
          {food.name}
        </AppText>
        <AppText variant="bodySm" color="onSurfaceVariant" numberOfLines={1}>
          {food.brand ? `${food.brand} · ` : ''}
          {food.adjustable
            ? `${food.basis.kcal} kcal per 100 g`
            : `${food.basis.kcal} kcal · ${food.basis.protein} g protein`}
        </AppText>
      </View>
      <Icon name="add_circle_outline" size={22} color="primary" />
    </Pressable>
  );
}

/**
 * Everything for adding food: search the database by name, offer recent meals, scan a barcode, pick an
 * amount, or fall back to typing it in. One surface is open at a time, so the screens never stack.
 */
export function FoodLogFlow({
  surface,
  onSurfaceChange,
  defaultCategory,
  onLog,
  onManual,
}: FoodLogFlowProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [typed, setTyped] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [food, setFood] = useState<FoodItem | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanBusy, setScanBusy] = useState(false);

  const search = useFoodSearch(submitted);
  const recent = useRecentFoods();

  const lookup = async (barcode: string) => {
    setScanBusy(true);
    setScanMessage(null);
    try {
      const found = await foodSearchService.byBarcode(barcode);
      if (found) setFood(found);
      else {
        setScanMessage(
          'No product with nutrition data was found for that barcode. Try again, search by name, or add it manually.',
        );
      }
    } catch (error) {
      setScanMessage(
        error instanceof FoodSearchError ? error.message : 'Something went wrong. Try again.',
      );
    } finally {
      setScanBusy(false);
    }
  };

  const close = () => {
    setFood(null);
    onSurfaceChange('closed');
  };

  const results = search.data ?? [];
  const showRecent = submitted.trim().length < 2;
  const items = showRecent ? (recent.data ?? []) : results;

  return (
    <>
      <Modal visible={surface === 'search' && !food} animationType="slide" onRequestClose={close}>
        <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
          <View style={{ padding: 20, gap: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <AppText variant="headlineMd" accessibilityRole="header">
                Add food
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={close}
                hitSlop={12}
              >
                <Icon name="close" size={24} color="onSurfaceVariant" />
              </Pressable>
            </View>
            <CustomInput
              label="Search foods"
              placeholder="e.g. greek yogurt"
              value={typed}
              onChangeText={setTyped}
              onSubmitEditing={() => setSubmitted(typed)}
              returnKeyType="search"
              autoCorrect={false}
            />
            <PrimaryButton
              label="Search"
              onPress={() => setSubmitted(typed)}
              disabled={typed.trim().length < 2}
              loading={search.isFetching}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <SecondaryButton
                  label="Scan barcode"
                  size="md"
                  leftIcon={<Icon name="qr_code_scanner" size={18} color="primary" />}
                  onPress={() => onSurfaceChange('scan')}
                />
              </View>
              <View style={{ flex: 1 }}>
                <SecondaryButton
                  label="Add manually"
                  size="md"
                  leftIcon={<Icon name="edit" size={18} color="primary" />}
                  onPress={() => {
                    close();
                    onManual();
                  }}
                />
              </View>
            </View>
          </View>

          {search.isFetching ? <LoadingIndicator label="Searching" /> : null}
          {search.error ? (
            <View style={{ paddingHorizontal: 20, gap: 8 }}>
              <AppText variant="bodyMd" color="warning" accessibilityRole="alert">
                {search.error instanceof FoodSearchError
                  ? search.error.message
                  : 'Something went wrong. Try again.'}
              </AppText>
            </View>
          ) : null}

          <FlatList
            data={search.isFetching ? [] : items}
            keyExtractor={(f) => f.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}
            ListHeaderComponent={
              !search.isFetching && items.length > 0 ? (
                <AppText
                  variant="labelCaps"
                  color="onSurfaceVariant"
                  uppercase
                  style={{ paddingBottom: 4 }}
                >
                  {showRecent ? 'Recent meals' : `${results.length} results`}
                </AppText>
              ) : undefined
            }
            ListEmptyComponent={
              search.isFetching || search.error ? undefined : (
                <AppText variant="bodyMd" color="onSurfaceVariant">
                  {showRecent
                    ? 'Search for a food, scan a barcode, or add one manually. Meals you log will show up here to log again.'
                    : 'No foods found. Try different words, scan the barcode, or add it manually.'}
                </AppText>
              )
            }
            renderItem={({ item }) => <FoodRow food={item} onPress={() => setFood(item)} />}
          />
          <AppText
            variant="bodySm"
            color="onSurfaceVariant"
            style={{ textAlign: 'center', padding: 12, paddingBottom: 12 + insets.bottom }}
          >
            Food data from Open Food Facts (ODbL). It is community-made, so check labels for
            accuracy.
          </AppText>
        </View>
      </Modal>

      <BarcodeScannerModal
        visible={surface === 'scan' && !food}
        onClose={() => {
          setScanMessage(null);
          onSurfaceChange('closed');
        }}
        onBarcode={(code) => void lookup(code)}
        message={scanMessage}
        busy={scanBusy}
      />

      <FoodPortionSheet
        food={food}
        defaultCategory={defaultCategory}
        onClose={() => setFood(null)}
        onAdd={async (meal) => {
          await onLog(meal);
          close();
        }}
      />
    </>
  );
}
